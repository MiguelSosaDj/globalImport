-- 0004_restrict_logos_storage_writes.sql
-- Hallazgo real: "negocios suben su logo" (INSERT) y "negocios actualizan su
-- logo" (UPDATE) en storage.objects solo verifican bucket_id = 'logos', sin
-- comprobar ningún tipo de propiedad. Cualquiera (incluso sin sesión) puede
-- subir o sobreescribir cualquier archivo dentro del bucket `logos` llamando
-- directamente al Storage API con la anon key.
--
-- La app real (app/api/negocios/logo/route.ts) ya sube los logos usando la
-- service_role key desde el servidor, y desde la Fase 1 de este trabajo esa
-- ruta ya verifica que el negocioId pertenezca al usuario autenticado
-- (lib/auth-negocio.ts). Quitar estas dos políticas públicas de storage no
-- rompe nada de lo que la app usa hoy — solo cierra la puerta trasera que
-- las saltaba por completo.

drop policy if exists "negocios suben su logo" on storage.objects;
drop policy if exists "negocios actualizan su logo" on storage.objects;

-- Se mantiene intencionalmente "logos publicos lectura" (SELECT) — los
-- logos sí deben verse públicamente en la landing y en /agendar/[negocioId].
