-- 0010_paquetes.sql
-- Fase 7: paquetes de sesiones (ej. "5 sesiones de fisioterapia"). Aditiva,
-- no toca ninguna tabla existente salvo por una columna NULLABLE nueva en
-- citas. Un negocio sin paquetes configurados sigue funcionando exactamente
-- igual que hoy.

create table if not exists public.paquetes (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  servicio_id uuid not null references public.servicios(id) on delete cascade,
  nombre text not null,
  numero_sesiones integer not null,
  precio numeric not null,
  vigencia_dias integer not null default 90,
  condiciones text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists paquetes_negocio_id_idx on public.paquetes (negocio_id);

create table if not exists public.paquetes_pacientes (
  id uuid primary key default gen_random_uuid(),
  paquete_id uuid not null references public.paquetes(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  sesiones_usadas integer not null default 0,
  sesiones_restantes integer not null,
  fecha_compra timestamptz not null default now(),
  fecha_vencimiento date,
  estado text not null default 'activo' check (estado in ('activo', 'agotado', 'vencido')),
  created_at timestamptz not null default now()
);

create index if not exists paquetes_pacientes_paciente_id_idx on public.paquetes_pacientes (paciente_id);

alter table public.citas
  add column if not exists paquete_paciente_id uuid references public.paquetes_pacientes(id) on delete set null;

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.paquetes enable row level security;
alter table public.paquetes_pacientes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'paquetes'
      and policyname = 'negocio gestiona sus paquetes'
  ) then
    create policy "negocio gestiona sus paquetes" on public.paquetes
      for all
      using (negocio_id in (select id from public.negocios where user_id = auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'paquetes'
      and policyname = 'paquetes activos publicos para agendar'
  ) then
    create policy "paquetes activos publicos para agendar" on public.paquetes
      for select
      using (activo = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'paquetes_pacientes'
      and policyname = 'negocio gestiona paquetes de sus pacientes'
  ) then
    create policy "negocio gestiona paquetes de sus pacientes" on public.paquetes_pacientes
      for all
      using (
        paquete_id in (
          select p.id from public.paquetes p
          join public.negocios n on n.id = p.negocio_id
          where n.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Nota: `paquetes_pacientes` NO tiene policy pública — contiene el saldo de
-- sesiones de cada paciente, nunca debe ser legible sin sesión.
