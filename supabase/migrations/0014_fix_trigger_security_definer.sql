-- 0014_fix_trigger_security_definer.sql
--
-- Bug real encontrado al probar 0013 en producción: el trigger
-- citas_validar_y_asignar_ordinal necesita LEER negocios (citas_simultaneas,
-- limite_citas_mes, plan) y contar citas existentes en el mismo slot/mes. Sin
-- `security definer`, esas lecturas corren con los permisos de quien hace el
-- INSERT — y la reserva pública sin pago inserta directo desde el navegador
-- con la anon key. Las políticas RLS de `negocios` ("ver negocio propio") y
-- de `citas` ("ver citas del negocio") solo dejan ver filas al dueño
-- autenticado, así que para un cliente anónimo esas consultas devuelven 0
-- filas — el trigger queda "ciego": siempre cree que el negocio tiene
-- citas_simultaneas=1 (default) y que el slot está vacío, sin importar
-- cuántas citas reales ya existan ahí.
--
-- El índice viejo (0002) nunca sufrió esto porque un índice único no
-- necesita permiso de lectura para rechazar un duplicado — opera sobre la
-- tabla física sin pasar por RLS. El trigger nuevo sí ejecuta SELECTs
-- normales, así que si no tiene bypass de RLS, sus SELECTs quedan filtrados.
--
-- Fix: marcar la función SECURITY DEFINER (corre con los permisos del dueño
-- de la función, que sí puede leer todas las filas) y fijar search_path
-- explícito (buena práctica de seguridad recomendada por Postgres para
-- funciones SECURITY DEFINER, evita que alguien redirija a qué tabla
-- "public.negocios" apunta con un search_path malicioso).

create or replace function public.citas_validar_y_asignar_ordinal()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_negocio record;
  v_ocupados_slot integer;
  v_ordinal integer;
  v_limite_mes integer;
  v_citas_mes integer;
begin
  select citas_simultaneas, limite_citas_mes, plan
  into v_negocio
  from public.negocios
  where id = new.negocio_id;

  select count(*) into v_ocupados_slot
  from public.citas
  where negocio_id = new.negocio_id
    and fecha = new.fecha
    and hora = new.hora
    and estado_cita <> 'cancelada';

  if v_ocupados_slot >= coalesce(v_negocio.citas_simultaneas, 1) then
    raise exception 'Ese horario ya no tiene cupos disponibles'
      using errcode = 'CY001';
  end if;

  select min(o) into v_ordinal
  from generate_series(1, coalesce(v_negocio.citas_simultaneas, 1)) o
  where not exists (
    select 1 from public.citas
    where negocio_id = new.negocio_id
      and fecha = new.fecha
      and hora = new.hora
      and estado_cita <> 'cancelada'
      and slot_ordinal = o
  );

  new.slot_ordinal := coalesce(v_ordinal, coalesce(v_negocio.citas_simultaneas, 1) + 1);

  v_limite_mes := coalesce(
    v_negocio.limite_citas_mes,
    (select limite_citas_mes from public.planes_limites where plan = v_negocio.plan)
  );

  if v_limite_mes is not null then
    select count(*) into v_citas_mes
    from public.citas
    where negocio_id = new.negocio_id
      and estado_cita <> 'cancelada'
      and date_trunc('month', fecha) = date_trunc('month', new.fecha);

    if v_citas_mes >= v_limite_mes then
      raise exception 'Este negocio alcanzó el límite de citas de su plan para este mes'
        using errcode = 'CY002';
    end if;
  end if;

  return new;
end;
$function$;
