-- =====================================================================
-- seed.sql — Datos semilla para el entorno LOCAL (supabase start / db reset)
-- =====================================================================
-- Provee un restaurante demo DETERMINISTA usado por:
--   • Las pruebas de carga/estrés/escalabilidad de k6 (performance/k6)
--   • Desarrollo local y E2E
--
-- Todos los ids son fijos y siguen un patrón predecible para que los
-- scripts de k6 puedan construirlos sin consultar la base:
--   restaurante : 00000000-0000-4000-a000-000000000001
--   categorías  : ...a000-0000000000{10|11}  (KITCHEN | BAR)
--   mesas       : 00000000-0000-4000-b000-<n de 12 dígitos>   (n = 1..100)
--   ítems cocina: 00000000-0000-4000-c000-<n>                 (n = 1..10)
--   ítems barra : 00000000-0000-4000-d000-<n>                 (n = 1..10)
--
-- Idempotente: usa ON CONFLICT DO NOTHING para poder reaplicarse.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Restaurante demo (activo, requerido por POST /api/orders)
-- ---------------------------------------------------------------------
insert into public.restaurants (id, name, slug, status)
values ('00000000-0000-4000-a000-000000000001', 'Load Test Diner', 'load-test', 'ACTIVE')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Categorías: una por estación (KITCHEN y BAR) para ejercitar el
-- split de sub-pedidos en la creación de órdenes.
-- ---------------------------------------------------------------------
insert into public.categories (id, name, restaurant_id, target_station)
values
  ('00000000-0000-4000-a000-000000000010', 'Cocina', '00000000-0000-4000-a000-000000000001', 'KITCHEN'),
  ('00000000-0000-4000-a000-000000000011', 'Barra',  '00000000-0000-4000-a000-000000000001', 'BAR')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Ítems de menú: 10 de cocina + 10 de barra.
-- ---------------------------------------------------------------------
insert into public.menu_items (id, name, price, category_id, restaurant_id, is_active)
select
  '00000000-0000-4000-c000-' || lpad(n::text, 12, '0'),
  'Plato Cocina ' || n,
  (1000 + n * 100)::numeric,
  '00000000-0000-4000-a000-000000000010',
  '00000000-0000-4000-a000-000000000001',
  true
from generate_series(1, 10) as n
on conflict (id) do nothing;

insert into public.menu_items (id, name, price, category_id, restaurant_id, is_active)
select
  '00000000-0000-4000-d000-' || lpad(n::text, 12, '0'),
  'Bebida Barra ' || n,
  (2000 + n * 100)::numeric,
  '00000000-0000-4000-a000-000000000011',
  '00000000-0000-4000-a000-000000000001',
  true
from generate_series(1, 10) as n
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Mesas: 100 mesas FREE. Tener muchas reduce la contención sobre una
-- sola fila al simular muchos clientes concurrentes (cada VU elige una).
-- ---------------------------------------------------------------------
insert into public.tables (id, number, qr_data, restaurant_id, status)
select
  '00000000-0000-4000-b000-' || lpad(n::text, 12, '0'),
  n,
  'load-test-qr-' || n,
  '00000000-0000-4000-a000-000000000001',
  'FREE'
from generate_series(1, 100) as n
on conflict (id) do nothing;
