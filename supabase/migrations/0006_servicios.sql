-- 0006_servicios.sql
-- Fase 2: catálogo de servicios configurable por negocio, para reemplazar
-- progresivamente SERVICIOS_POR_TIPO / PRECIOS_POR_SERVICIO hardcodeados en
-- el código (app/agendar/page.tsx y app/agendar/[negocioId]/AgendarForm.tsx).
-- Aditiva: no toca negocios/citas/horarios_disponibilidad. El código sigue
-- funcionando para negocios sin filas aquí (fallback al catálogo hardcodeado
-- existente) hasta que cada negocio cargue su propio catálogo.

create table if not exists public.servicios (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  nombre text not null,
  descripcion text,
  categoria text,
  duracion_min integer not null default 30,
  precio numeric not null default 0,
  moneda text not null default 'COP',
  anticipo_tipo text not null default 'ninguno'
    check (anticipo_tipo in ('ninguno', 'fijo', 'porcentaje')),
  anticipo_valor numeric,
  color text,
  activo boolean not null default true,
  permite_pago_online boolean not null default false,
  permite_reserva_publica boolean not null default true,
  imagen_url text,
  tiempo_prep_antes_min integer not null default 0,
  tiempo_prep_despues_min integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists servicios_negocio_id_idx on public.servicios (negocio_id);

alter table public.servicios enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'servicios'
      and policyname = 'negocio gestiona sus servicios'
  ) then
    create policy "negocio gestiona sus servicios" on public.servicios
      for all
      using (negocio_id in (select id from public.negocios where user_id = auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'servicios'
      and policyname = 'servicios publicos para agendar'
  ) then
    create policy "servicios publicos para agendar" on public.servicios
      for select
      using (activo = true and permite_reserva_publica = true);
  end if;
end $$;
