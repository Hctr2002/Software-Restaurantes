-- pgTAP: valida el trigger tr_order_status_validation (validate_order_transition()).
-- Cubre las reglas de la máquina de estados de pedidos: estado inicial permitido,
-- transiciones válidas/ inválidas y estados terminales (COMPLETED/REJECTED).
-- Se ejecuta como owner (postgres) → RLS no interfiere; las FKs sí (se siembra el restaurante).
set search_path to public, extensions;
begin;
create extension if not exists pgtap;
select plan(17);

-- Tenant requerido por la FK orders.restaurant_id -> restaurants.id
insert into public.restaurants (id, name, slug) values ('r1', 'R1', 'r1');

-- Pedidos sembrados por la vía normal (estados iniciales permitidos)
insert into public.orders (id, restaurant_id, status) values
  ('p1', 'r1', 'PENDING'),
  ('p2', 'r1', 'PENDING'),
  ('p3', 'r1', 'PENDING'),
  ('v1', 'r1', 'VALIDATED');

-- Pedidos en estados intermedios/terminales sembrados con el trigger desactivado
alter table public.orders disable trigger tr_order_status_validation;
insert into public.orders (id, restaurant_id, status) values
  ('pr', 'r1', 'PREPARING'),
  ('pc', 'r1', 'PARCIAL'),
  ('dl', 'r1', 'DELIVERED'),
  ('cp', 'r1', 'COMPLETED'),
  ('rj', 'r1', 'REJECTED');
alter table public.orders enable trigger tr_order_status_validation;

-- ── Reglas de INSERT (estado inicial) ───────────────────────────────────────
select lives_ok(
  $$ insert into public.orders (id, restaurant_id, status) values ('h', 'r1', 'PENDING') $$,
  'INSERT acepta estado inicial PENDING');
select throws_ok(
  $$ insert into public.orders (id, restaurant_id, status) values ('bad', 'r1', 'READY') $$,
  null, null,
  'INSERT rechaza un estado inicial distinto de PENDING/VALIDATED');
select lives_ok(
  $$ insert into public.orders (id, restaurant_id, status) values ('w', 'r1', 'VALIDATED') $$,
  'INSERT acepta estado inicial VALIDATED');

-- ── Camino feliz completo sobre el pedido h ─────────────────────────────────
select lives_ok($$ update public.orders set status='VALIDATED' where id='h' $$, 'PENDING -> VALIDATED');
select lives_ok($$ update public.orders set status='PREPARING' where id='h' $$, 'VALIDATED -> PREPARING');
select lives_ok($$ update public.orders set status='READY'     where id='h' $$, 'PREPARING -> READY');
select lives_ok($$ update public.orders set status='DELIVERED' where id='h' $$, 'READY -> DELIVERED');
select lives_ok($$ update public.orders set status='COMPLETED' where id='h' $$, 'DELIVERED -> COMPLETED');

-- ── Transiciones inválidas y ramas alternativas ─────────────────────────────
select throws_ok($$ update public.orders set status='PREPARING' where id='p1' $$, null, null,
  'PENDING -> PREPARING es inválida (debe pasar por VALIDATED)');
select lives_ok($$ update public.orders set status='REJECTED' where id='p2' $$, 'PENDING -> REJECTED es válida');
select throws_ok($$ update public.orders set status='READY' where id='v1' $$, null, null,
  'VALIDATED -> READY es inválida');
select lives_ok($$ update public.orders set status='PARCIAL' where id='pr' $$, 'PREPARING -> PARCIAL es válida');
select lives_ok($$ update public.orders set status='DELIVERED' where id='pc' $$, 'PARCIAL -> DELIVERED es válida');
select throws_ok($$ update public.orders set status='PREPARING' where id='dl' $$, null, null,
  'DELIVERED -> PREPARING es inválida');
select throws_ok($$ update public.orders set status='PENDING' where id='cp' $$, null, null,
  'COMPLETED es terminal: no admite cambios');
select throws_ok($$ update public.orders set status='VALIDATED' where id='rj' $$, null, null,
  'REJECTED es terminal: no admite cambios');
select lives_ok($$ update public.orders set status='PENDING' where id='p3' $$, 'PENDING -> PENDING (no-op) es válida');

select * from finish();
rollback;
