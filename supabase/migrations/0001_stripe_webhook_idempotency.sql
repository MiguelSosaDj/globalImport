-- 0001_stripe_webhook_idempotency.sql
-- Aditiva, no toca ninguna tabla existente. Registra cada event.id de Stripe
-- ya procesado por /api/stripe-webhook para que un reintento del mismo evento
-- (Stripe reintenta automáticamente si no responde 2xx a tiempo) no vuelva a
-- aplicar el efecto (marcar cita como pagada, actualizar suscripción, etc).

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;

-- Solo el service role (usado exclusivamente por el webhook, nunca por el
-- browser) puede leer/escribir esta tabla. No se define policy para
-- authenticated/anon a propósito: sin policy, RLS deniega todo acceso salvo
-- al service role, que la ignora.
