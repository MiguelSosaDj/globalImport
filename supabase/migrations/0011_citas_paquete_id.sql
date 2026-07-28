-- 0011_citas_paquete_id.sql
-- Permite que el cliente elija comprar un paquete (en vez de una sola
-- sesión) al agendar públicamente. Aditiva, columna nullable — no afecta
-- citas existentes ni negocios sin paquetes configurados.
--
-- Nota: esto solo registra la INTENCIÓN de compra del paquete en la cita.
-- La asignación real de sesiones (tabla paquetes_pacientes) la sigue
-- haciendo el dueño manualmente desde el dashboard (Paquetes → Vender)
-- una vez confirma el pago y a qué paciente corresponde — la reserva
-- pública es anónima y no crea un paciente por sí sola.

alter table public.citas
  add column if not exists paquete_id uuid references public.paquetes(id) on delete set null;
