-- 0008_pacientes.sql
-- Fase 4a: entidad paciente persistente, para dejar de guardar solo texto
-- suelto (cliente_nombre/cliente_telefono) dentro de cada cita. Aditiva:
-- no borra ni modifica esas columnas de `citas` — se conservan como están.
-- citas.paciente_id es NULLABLE: las citas ya existentes y las nuevas
-- reservas públicas (que hoy no crean paciente) siguen funcionando igual.

create table if not exists public.pacientes (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  nombre text not null,
  apellidos text,
  tipo_documento text,
  numero_documento text,
  telefono text,
  correo text,
  fecha_nacimiento date,
  direccion text,
  contacto_emergencia_nombre text,
  contacto_emergencia_telefono text,
  notas text,
  preferencia_comunicacion text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists pacientes_negocio_id_idx on public.pacientes (negocio_id);
create index if not exists pacientes_telefono_idx on public.pacientes (negocio_id, telefono);
create index if not exists pacientes_documento_idx on public.pacientes (negocio_id, numero_documento);

alter table public.citas
  add column if not exists paciente_id uuid references public.pacientes(id) on delete set null;

alter table public.pacientes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pacientes'
      and policyname = 'negocio gestiona sus pacientes'
  ) then
    create policy "negocio gestiona sus pacientes" on public.pacientes
      for all
      using (negocio_id in (select id from public.negocios where user_id = auth.uid()));
  end if;
end $$;

-- Nota: a propósito NO hay policy pública de lectura sobre `pacientes` — a
-- diferencia de negocios/servicios/profesionales, los datos de un paciente
-- nunca deben ser visibles sin autenticación.
