-- 0005_harden_slots_rpc_grants.sql
-- Hallazgo real: get_available_slots(uuid, date) tiene EXECUTE otorgado a
-- PUBLIC, anon y authenticated, pero en el código real solo la llama
-- app/api/slots/route.ts usando la service_role key (createSupabaseAdmin).
-- Nadie en el frontend la invoca directo con el cliente de browser.
--
-- Además la función NO es SECURITY DEFINER: corre con los permisos de quien
-- la invoca. Si alguien la llamara directo con la anon key, la subconsulta
-- interna sobre `citas` quedaría bloqueada por la policy "ver citas del
-- negocio" (que exige auth.uid() = negocios.user_id) — como anon no tiene
-- ese uid, esa subconsulta siempre vería 0 filas, y la función reportaría
-- CUALQUIER horario como "disponible = true" sin importar si ya está
-- ocupado. No afecta el flujo real de la app (que llama vía service_role,
-- el cual sí ve todas las citas), pero es una superficie innecesaria.
--
-- Se revoca el EXECUTE de los roles que no lo necesitan.

revoke execute on function public.get_available_slots(uuid, date) from public;
revoke execute on function public.get_available_slots(uuid, date) from anon;
revoke execute on function public.get_available_slots(uuid, date) from authenticated;
