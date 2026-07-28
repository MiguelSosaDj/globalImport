-- 0015_recordatorios.sql
--
-- Recordatorio de 1 día antes para citas confirmadas, por dos canales:
--
-- 1) WhatsApp: no hay WhatsApp Business API contratada, así que es una cola
--    diaria en el dashboard — el negocio ve sus citas confirmadas para
--    mañana y con un clic (individual o "enviar a todos") abre WhatsApp con
--    el mensaje ya redactado, igual que el resto de los flujos de WhatsApp
--    ya existentes en la app. `recordatorio_enviado` evita reenviar dos
--    veces el mismo, se marca al hacer clic en "Enviar".
--
-- 2) Email: sí se puede automatizar por completo con nodemailer + un cron
--    diario (sin intervención humana), pero requiere que el cliente haya
--    dejado su correo al agendar (`cliente_correo`, opcional, no existía
--    antes) y que el negocio configure sus credenciales SMTP.
--    `recordatorio_email_enviado` evita mandarlo dos veces.

alter table public.citas
  add column if not exists recordatorio_enviado boolean not null default false,
  add column if not exists cliente_correo text,
  add column if not exists recordatorio_email_enviado boolean not null default false;

comment on column public.citas.recordatorio_enviado is
  'Si ya se le mandó (o se marcó como mandado) el recordatorio por WhatsApp de 1 día antes. Se pone en true desde el dashboard al hacer clic en "Enviar".';
comment on column public.citas.cliente_correo is
  'Correo opcional del cliente, capturado al agendar. Sin esto no se puede mandar el recordatorio por email.';
comment on column public.citas.recordatorio_email_enviado is
  'Si ya se le mandó el recordatorio por email de 1 día antes. Lo marca el cron diario (/api/cron/recordatorios), no el dashboard.';
