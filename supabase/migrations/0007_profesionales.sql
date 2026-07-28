-- 0007_profesionales.sql
-- Fase 3a: modelo de datos para uno o varios profesionales por negocio.
-- Aditiva: no toca negocios/citas existentes salvo por una columna nueva
-- NULLABLE (citas.profesional_id). Un negocio con cero profesionales sigue
-- funcionando exactamente igual que hoy (horario a nivel de negocio); no es
-- obligatorio crear ninguno.
--
-- Nota importante: esta migración NO cambia get_available_slots() todavía.
-- La disponibilidad sigue calculándose por negocio, no por profesional
-- individual — eso es la Fase 3b, deliberadamente separada por ser el
-- cambio con más riesgo (afecta el cálculo de horarios de TODOS los
-- negocios en producción).

create table if not exists public.profesionales (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  nombre text not null,
  apellidos text,
  foto_url text,
  telefono text,
  correo text,
  especialidad text,
  descripcion text,
  color text,
  activo boolean not null default true,
  tiempo_preparacion_min integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists profesionales_negocio_id_idx on public.profesionales (negocio_id);

create table if not exists public.profesional_horarios (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid not null references public.profesionales(id) on delete cascade,
  dia_semana integer not null,
  hora_inicio time,
  hora_fin time,
  activo boolean not null default false,
  created_at timestamptz not null default now(),
  unique (profesional_id, dia_semana)
);

create table if not exists public.profesional_bloqueos (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid not null references public.profesionales(id) on delete cascade,
  fecha_inicio date not null,
  fecha_fin date not null,
  motivo text,
  todo_el_dia boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profesional_servicios (
  profesional_id uuid not null references public.profesionales(id) on delete cascade,
  servicio_id uuid not null references public.servicios(id) on delete cascade,
  primary key (profesional_id, servicio_id)
);

-- citas.profesional_id: nullable, sin afectar filas existentes.
alter table public.citas
  add column if not exists profesional_id uuid references public.profesionales(id) on delete set null;

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.profesionales enable row level security;
alter table public.profesional_horarios enable row level security;
alter table public.profesional_bloqueos enable row level security;
alter table public.profesional_servicios enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profesionales'
      and policyname = 'negocio gestiona sus profesionales'
  ) then
    create policy "negocio gestiona sus profesionales" on public.profesionales
      for all
      using (negocio_id in (select id from public.negocios where user_id = auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profesionales'
      and policyname = 'profesionales publicos para agendar'
  ) then
    create policy "profesionales publicos para agendar" on public.profesionales
      for select
      using (activo = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profesional_horarios'
      and policyname = 'negocio gestiona horarios de profesionales'
  ) then
    create policy "negocio gestiona horarios de profesionales" on public.profesional_horarios
      for all
      using (
        profesional_id in (
          select p.id from public.profesionales p
          join public.negocios n on n.id = p.negocio_id
          where n.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profesional_bloqueos'
      and policyname = 'negocio gestiona bloqueos de profesionales'
  ) then
    create policy "negocio gestiona bloqueos de profesionales" on public.profesional_bloqueos
      for all
      using (
        profesional_id in (
          select p.id from public.profesionales p
          join public.negocios n on n.id = p.negocio_id
          where n.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profesional_servicios'
      and policyname = 'negocio gestiona servicios de profesionales'
  ) then
    create policy "negocio gestiona servicios de profesionales" on public.profesional_servicios
      for all
      using (
        profesional_id in (
          select p.id from public.profesionales p
          join public.negocios n on n.id = p.negocio_id
          where n.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profesional_servicios'
      and policyname = 'profesional_servicios publico para agendar'
  ) then
    create policy "profesional_servicios publico para agendar" on public.profesional_servicios
      for select
      using (true);
  end if;
end $$;
