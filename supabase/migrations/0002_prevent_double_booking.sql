-- 0002_prevent_double_booking.sql
-- Hoy nada a nivel de BD impide que dos citas ocupen el mismo negocio_id +
-- fecha + hora: get_available_slots() solo chequea disponibilidad AL
-- CONSULTAR, no al INSERTAR — dos reservas concurrentes para el mismo slot
-- (dos pestañas, doble clic, o dos clientes distintos) pueden pasar la
-- verificación de disponibilidad antes de que la primera termine de
-- insertarse (race condition clásica de "check-then-act").
--
-- Este índice único parcial hace que el propio Postgres rechace el segundo
-- insert con un conflicto (código 23505), sin importar qué haya validado la
-- aplicación antes. Se excluyen las citas canceladas para permitir volver a
-- ocupar un slot liberado.

create unique index if not exists citas_no_doble_booking
  on public.citas (negocio_id, fecha, hora)
  where estado_cita <> 'cancelada';
