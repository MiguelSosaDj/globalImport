-- ============================================================================
-- ███  NO EJECUTAR EN SUPABASE  ███
-- Este archivo es SOLO DOCUMENTACIÓN. No es una migración ejecutable y NO
-- forma parte de la secuencia numerada 0001, 0002, 0003... que sí se aplica.
-- Tu base de datos YA contiene estas tablas y políticas (por eso falla si lo
-- corres: intenta recrear "ver negocio propio", que ya existe). Se conserva
-- en el repo únicamente como snapshot fiel del esquema real al 2026-07-28,
-- para que cualquiera pueda ver de dónde partieron las migraciones 0001+ sin
-- tener que volver a auditar la base de datos desde cero.
-- ============================================================================
--
-- 0000_baseline.sql — snapshot de control de versión del esquema REAL de
-- CitasYa (proyecto Supabase levkgasiadwuwjhlrplf), obtenido el 2026-07-28
-- mediante consulta de solo lectura contra information_schema / pg_catalog.
--
-- Deliberadamente NO incluye la tabla `productos` (public.productos): existe
-- en este mismo proyecto Supabase pero no es referenciada en ninguna parte
-- del código de CitasYa (sin FKs hacia negocios/citas). Parece pertenecer a
-- otra aplicación que comparte el proyecto. Ver nota de seguridad al final.

-- ── Tabla: negocios ──────────────────────────────────────────────────────────
create table if not exists public.negocios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null,
  created_at timestamptz default now(),
  user_id uuid references auth.users(id),
  plan text default 'gratuito',
  subscription_status text default 'inactivo',
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_start timestamptz,
  subscription_end timestamptz,
  requiere_pago boolean default false,
  duracion_cita integer default 30,
  logo_url text,
  color_primario text default '#7c3aed',
  color_secundario text default '#a855f7'
);

alter table public.negocios enable row level security;

create policy "ver negocio propio" on public.negocios
  for all
  using (auth.uid() = user_id);

create policy "ver negocio publico" on public.negocios
  for select
  using (true);

-- ── Tabla: horarios_disponibilidad ───────────────────────────────────────────
create table if not exists public.horarios_disponibilidad (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid references public.negocios(id) on delete cascade,
  dia_semana integer not null,
  hora_inicio time,
  hora_fin time,
  activo boolean default false,
  created_at timestamptz default now(),
  unique (negocio_id, dia_semana)
);

alter table public.horarios_disponibilidad enable row level security;

create policy "horario publico para agendar" on public.horarios_disponibilidad
  for select
  using (true);

create policy "negocio gestiona su horario" on public.horarios_disponibilidad
  for all
  using (negocio_id in (select id from public.negocios where user_id = auth.uid()));

-- ── Tabla: citas ──────────────────────────────────────────────────────────────
create table if not exists public.citas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid references public.negocios(id) on delete cascade,
  cliente_nombre text not null,
  cliente_telefono text not null,
  servicio text not null,
  fecha date not null,
  hora time not null,
  created_at timestamptz default now(),
  monto numeric,
  stripe_session_id text unique,
  estado_pago text default 'pendiente',
  estado_cita text default 'pendiente'
);

alter table public.citas enable row level security;

create policy "insertar cita publica" on public.citas
  for insert
  with check (true);

create policy "ver citas del negocio" on public.citas
  for all
  using (negocio_id in (select id from public.negocios where user_id = auth.uid()));

-- ── Función RPC: get_available_slots ─────────────────────────────────────────
-- Calcula los slots del día según horarios_disponibilidad + negocios.duracion_cita,
-- descartando los ya ocupados en `citas` (excepto estado_cita = 'cancelada').
-- NO es security definer: corre con los permisos del rol que la invoca.
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
begin
  v_dia_semana := extract(dow from p_fecha);

  select hd.hora_inicio, hd.hora_fin, hd.activo, n.duracion_cita
  into v_hora_inicio, v_hora_fin, v_activo, v_duracion
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
    not exists (
      select 1 from citas c
      where c.negocio_id = p_negocio_id
        and c.fecha = p_fecha
        and c.estado_cita != 'cancelada'
        and c.hora = slot_inicio::time
    ) as disponible
  from slots
  order by slot_inicio;
end;
$function$;

-- ── Storage bucket: logos ────────────────────────────────────────────────────
-- Bucket `logos` con lectura pública. Escritura originalmente pública también
-- (ver hallazgo de seguridad — corregido en 0004_restrict_logos_storage_writes.sql).

-- ── Nota de seguridad detectada en esta auditoría (no corregida aquí) ────────
-- 1) "ver negocio publico" expone TODAS las columnas de negocios a cualquiera,
--    incluyendo stripe_customer_id, stripe_subscription_id, subscription_status,
--    user_id. Corregido en 0003_negocios_public_view.sql.
-- 2) Las políticas de storage.objects para el bucket `logos` permiten INSERT/
--    UPDATE público sin verificar dueño. Corregido en
--    0004_restrict_logos_storage_writes.sql.
-- 3) get_available_slots tiene EXECUTE otorgado a `anon`/`authenticated` sin
--    necesitarlo (solo el backend con service_role la llama). Corregido en
--    0005_harden_slots_rpc_grants.sql.
-- 4) No existe restricción a nivel de BD contra doble reserva del mismo
--    negocio_id+fecha+hora. Corregido en 0002_prevent_double_booking.sql.
-- 5) La tabla `public.productos` (id, name, origin, destiny, price, status,
--    created_at) vive en este mismo proyecto Supabase con una política
--    "Enable read access for all users" (SELECT público) pero no tiene
--    ninguna relación con CitasYa (sin FK hacia negocios/citas, no aparece en
--    el código del repo). Probablemente pertenece a otra aplicación que
--    comparte este proyecto Supabase. No se toca en esta auditoría — señalar
--    al usuario antes de decidir si esa exposición pública es intencional.
