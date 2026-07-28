-- 0003_negocios_public_view.sql
-- Hallazgo real de esta auditoría: la policy "ver negocio publico" (SELECT
-- USING true) expone TODAS las columnas de la tabla `negocios` — incluyendo
-- stripe_customer_id, stripe_subscription_id, subscription_status, plan y
-- user_id — a cualquier visitante sin sesión, para TODOS los negocios, vía
-- `GET /rest/v1/negocios?select=*` con la anon key (que es pública, vive en
-- NEXT_PUBLIC_SUPABASE_ANON_KEY).
--
-- RLS es de fila, no de columna, así que la corrección correcta es: quitar
-- la política pública de la tabla base (solo el dueño la ve vía
-- "ver negocio propio") y exponer una vista con únicamente las columnas que
-- las páginas públicas de agendamiento realmente necesitan.

drop policy if exists "ver negocio publico" on public.negocios;

create or replace view public.negocios_publico as
select
  id,
  nombre,
  tipo,
  requiere_pago,
  duracion_cita,
  logo_url,
  color_primario,
  color_secundario
from public.negocios;

grant select on public.negocios_publico to anon, authenticated;
