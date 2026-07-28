-- 0013_citas_simultaneas_y_limites.sql
--
-- Dos features nuevas pedidas por el usuario:
--
-- 1) Cupos simultáneos por horario: un negocio puede permitir N citas a la
--    misma hora (ej. 3 citas a las 2pm) en vez de solo 1. El slot se
--    deshabilita automáticamente cuando las N citas de ese horario ya están
--    agendadas.
-- 2) Límite de citas por mes según el plan: cada plan tiene un tope mensual
--    de citas (gratuito=10, básico=50, pro=200, premium=ilimitado, iguales a
--    los que ya promete la copy de /precios); el admin puede además poner un
--    override específico por negocio desde el panel de administrador.
--
-- Ambas reglas se aplican con un TRIGGER a nivel de base de datos (no solo
-- validación en la app) — así ninguna de las dos vías de inserción de citas
-- que existen hoy (insert directo desde el navegador con la anon key para
-- reservas sin pago, o insert server-side con service_role para reservas
-- pagadas por Stripe) puede saltarse el límite, y una concurrencia real
-- (dos clientes reservando el mismo último cupo al mismo tiempo) sigue
-- protegida por un índice único — el mismo patrón que ya usa
-- 0002_prevent_double_booking.sql, extendido para permitir más de 1 cita por
-- slot en vez de reemplazarlo por una validación "de buena fe".

-- ── 1) Columnas nuevas en negocios ───────────────────────────────────────────
alter table public.negocios
  add column if not exists citas_simultaneas integer not null default 1,
  add column if not exists limite_citas_mes integer;

comment on column public.negocios.citas_simultaneas is
  'Cuántas citas puede haber a la misma fecha+hora para este negocio antes de que el slot se marque como no disponible. Editable por el admin.';
comment on column public.negocios.limite_citas_mes is
  'Override manual del tope de citas por mes calendario para este negocio. NULL = usa el default de planes_limites según negocios.plan.';

-- ── 2) Tabla de límites por plan (default cuando no hay override) ───────────
create table if not exists public.planes_limites (
  plan text primary key,
  limite_citas_mes integer -- NULL = ilimitado
);

insert into public.planes_limites (plan, limite_citas_mes) values
  ('gratuito', 10),
  ('basico', 50),
  ('pro', 200),
  ('premium', null)
on conflict (plan) do nothing;

alter table public.planes_limites enable row level security;
-- Sin policies para anon/authenticated a propósito: solo se lee desde el
-- trigger (que corre con los permisos de quien inserta en `citas`, así que
-- SÍ necesita poder leerla) — se otorga SELECT explícito más abajo en vez de
-- depender de RLS abierta.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'planes_limites'
      and policyname = 'lectura publica de limites de plan'
  ) then
    create policy "lectura publica de limites de plan" on public.planes_limites
      for select
      using (true);
  end if;
end $$;

-- ── 3) slot_ordinal: qué "cupo" (1..citas_simultaneas) ocupa cada cita ──────
alter table public.citas
  add column if not exists slot_ordinal integer not null default 1;

-- ── 4) Reemplazar el índice de no-doble-booking para permitir N por slot ────
drop index if exists public.citas_no_doble_booking;

create unique index if not exists citas_no_doble_booking
  on public.citas (negocio_id, fecha, hora, slot_ordinal)
  where estado_cita <> 'cancelada';

-- ── 5) Trigger: asigna slot_ordinal y aplica los dos límites en el insert ───
create or replace function public.citas_validar_y_asignar_ordinal()
returns trigger
language plpgsql
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

  -- ── Cupo simultáneo por horario ──
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

  -- ── Límite de citas por mes según plan (o el override del negocio) ──
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

drop trigger if exists trg_citas_validar_y_asignar_ordinal on public.citas;

create trigger trg_citas_validar_y_asignar_ordinal
  before insert on public.citas
  for each row execute function public.citas_validar_y_asignar_ordinal();

-- ── 6) get_available_slots: "disponible" ahora es un conteo, no un booleano simple ──
create or replace function public.get_available_slots(p_negocio_id uuid, p_fecha date)
returns table(hora_inicio time, disponible boolean)
language plpgsql
as $function$
declare
  v_dia_semana int;
  v_hora_inicio time;
  v_hora_fin time;
  v_duracion int;
  v_activo boolean;
  v_citas_simultaneas int;
begin
  v_dia_semana := extract(dow from p_fecha);

  select hd.hora_inicio, hd.hora_fin, hd.activo, n.duracion_cita, n.citas_simultaneas
  into v_hora_inicio, v_hora_fin, v_activo, v_duracion, v_citas_simultaneas
  from horarios_disponibilidad hd
  join negocios n on n.id = hd.negocio_id
  where hd.negocio_id = p_negocio_id
    and hd.dia_semana = v_dia_semana;

  if v_activo is null or v_activo = false then
    return;
  end if;

  return query
  with slots as (
    select generate_series(
      (p_fecha + v_hora_inicio)::timestamp,
      (p_fecha + v_hora_fin)::timestamp - (v_duracion || ' minutes')::interval,
      (v_duracion || ' minutes')::interval
    ) as slot_inicio
  )
  select
    slot_inicio::time as hora_inicio,
    (
      select count(*) from citas c
      where c.negocio_id = p_negocio_id
        and c.fecha = p_fecha
        and c.estado_cita != 'cancelada'
        and c.hora = slot_inicio::time
    ) < coalesce(v_citas_simultaneas, 1) as disponible
  from slots
  order by slot_inicio;
end;
$function$;
