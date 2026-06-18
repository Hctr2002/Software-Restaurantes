-- pgTAP: valida el aislamiento multi-tenant por RLS en la tabla orders.
-- Simula un usuario autenticado fijando request.jwt.claims (lo que lee
-- get_auth_restaurant_id()) y el rol `authenticated`, sobre el que SÍ se aplica RLS
-- (postgres, como owner, la omite). Verifica que cada restaurante solo ve/escribe lo suyo.
set search_path to public, extensions;
begin;
create extension if not exists pgtap;
select plan(6);

-- Datos de dos restaurantes (sembrados como owner → RLS omitida)
insert into public.restaurants (id, name, slug) values ('r1', 'Rest 1', 'r1'), ('r2', 'Rest 2', 'r2');
insert into public.orders (id, restaurant_id, status) values ('o1', 'r1', 'PENDING'), ('o2', 'r2', 'PENDING');

-- ── Contexto: usuario autenticado del restaurante r1 ────────────────────────
select set_config('request.jwt.claims', '{"app_metadata":{"restaurant_id":"r1","role":"ADMIN"}}', true);
set local role authenticated;

select is((select count(*) from public.orders)::int, 1, 'r1 solo ve 1 pedido (el suyo)');
select is((select id from public.orders limit 1), 'o1', 'el pedido visible para r1 es o1');
select is((select count(*) from public.orders where id = 'o2')::int, 0, 'r1 NO puede ver el pedido de r2');

reset role;

-- ── Contexto: usuario autenticado del restaurante r2 ────────────────────────
select set_config('request.jwt.claims', '{"app_metadata":{"restaurant_id":"r2","role":"ADMIN"}}', true);
set local role authenticated;

select is((select count(*) from public.orders)::int, 1, 'r2 solo ve 1 pedido (el suyo)');
select is((select id from public.orders limit 1), 'o2', 'el pedido visible para r2 es o2');

reset role;

-- ── UPDATE: r1 no puede modificar pedidos de otro restaurante (política update_orders) ──
-- Nota: la política `insert_orders` es permisiva (WITH CHECK true), por lo que el
-- aislamiento de escritura se garantiza en SELECT/UPDATE, no en INSERT (los pedidos
-- los crea el portal del cliente vía service role). Aquí verificamos el UPDATE.
select set_config('request.jwt.claims', '{"app_metadata":{"restaurant_id":"r1","role":"ADMIN"}}', true);
set local role authenticated;

-- El UPDATE no falla pero afecta 0 filas: RLS (USING) oculta o2 para r1.
update public.orders set notes = 'intrusion' where id = 'o2';

reset role;

-- Verificación como owner (RLS omitida): o2 quedó intacto.
select is(
  (select notes from public.orders where id = 'o2'),
  null,
  'r1 NO pudo modificar (UPDATE) el pedido de r2 — filtrado por update_orders USING');

select * from finish();
rollback;
