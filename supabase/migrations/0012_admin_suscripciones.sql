-- 0012_admin_suscripciones.sql
-- Panel de administrador de CitasYa (no de un negocio, sino de la plataforma
-- misma): método de pago activo (Stripe o Nequi) y solicitudes de
-- suscripción manuales pagadas por Nequi que el admin aprueba a mano.
--
-- Estas tablas NO tienen policies para anon/authenticated a propósito —
-- solo se leen/escriben desde rutas API protegidas con service_role +
-- verificación de admin en el servidor (lib/auth-admin.ts), igual que
-- stripe_webhook_events en la Fase 1.

create table if not exists public.app_config (
  id integer primary key default 1,
  metodo_pago text not null default 'stripe' check (metodo_pago in ('stripe', 'nequi')),
  updated_at timestamptz not null default now(),
  constraint app_config_singleton check (id = 1)
);

insert into public.app_config (id, metodo_pago)
values (1, 'stripe')
on conflict (id) do nothing;

alter table public.app_config enable row level security;

create table if not exists public.solicitudes_suscripcion (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  correo text not null,
  telefono text not null,
  negocio_nombre text not null,
  tipo_negocio text not null,
  plan text not null,
  periodo text not null default 'mensual' check (periodo in ('mensual', 'anual')),
  comprobante_path text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  created_at timestamptz not null default now(),
  procesada_at timestamptz
);

alter table public.solicitudes_suscripcion enable row level security;

-- Bucket privado para comprobantes de pago (Nequi). Nunca público — solo
-- se lee mediante URL firmada generada por una ruta de admin con
-- service_role.
insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;
