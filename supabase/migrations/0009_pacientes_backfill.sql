-- ============================================================================
-- MIGRACIÓN DE DATOS REALES — revisa antes de correr
-- ============================================================================
-- A diferencia de las demás migraciones de esta carpeta (que solo crean
-- estructura), esta SÍ inserta filas nuevas en `pacientes` a partir de tus
-- citas existentes y actualiza `citas.paciente_id`. No borra ni sobrescribe
-- nada — es 100% aditiva y segura de correr más de una vez (usa
-- "where not exists" / "where paciente_id is null" en cada paso) — pero es
-- una migración de DATOS, no solo de esquema, así que corre 0008 primero y
-- decide tú cuándo aplicar esta.
--
-- Qué hace: por cada combinación única (negocio_id, cliente_telefono) en
-- `citas` que todavía no tenga paciente_id, crea un paciente usando el
-- nombre más reciente asociado a ese teléfono, y enlaza todas las citas de
-- ese teléfono al paciente creado.
-- ============================================================================

with telefonos_sin_paciente as (
  select distinct on (negocio_id, cliente_telefono)
    negocio_id,
    cliente_telefono,
    cliente_nombre,
    created_at
  from public.citas
  where paciente_id is null
    and cliente_telefono is not null
    and cliente_telefono <> ''
  order by negocio_id, cliente_telefono, created_at desc
),
insertados as (
  insert into public.pacientes (negocio_id, nombre, telefono)
  select t.negocio_id, t.cliente_nombre, t.cliente_telefono
  from telefonos_sin_paciente t
  where not exists (
    select 1 from public.pacientes p
    where p.negocio_id = t.negocio_id and p.telefono = t.cliente_telefono
  )
  returning id, negocio_id, telefono
)
update public.citas c
set paciente_id = p.id
from public.pacientes p
where c.paciente_id is null
  and c.negocio_id = p.negocio_id
  and c.cliente_telefono = p.telefono;
