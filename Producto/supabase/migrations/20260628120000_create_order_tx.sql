-- create_order_tx: escribe un pedido completo de forma ATÓMICA.
-- Inserta las sub-órdenes (split KITCHEN/BAR), sus ítems y marca la mesa OCCUPIED
-- dentro de una sola transacción. Las validaciones (restaurante activo, ítems del
-- restaurante, resolución de estación, session_id) se hacen en el route; esta función
-- solo persiste las filas ya construidas, en un único round-trip y todo-o-nada.
CREATE OR REPLACE FUNCTION public.create_order_tx(
  p_orders jsonb,
  p_items jsonb,
  p_table_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO orders (id, restaurant_id, table_id, session_id, status, total_amount, station, parent_order_id, notes)
  SELECT
    o->>'id',
    o->>'restaurant_id',
    NULLIF(o->>'table_id', ''),
    NULLIF(o->>'session_id', '')::uuid,
    COALESCE(NULLIF(o->>'status', ''), 'PENDING')::public."OrderStatus",
    (o->>'total_amount')::numeric,
    o->>'station',
    NULLIF(o->>'parent_order_id', '')::uuid,
    o->>'notes'
  FROM jsonb_array_elements(p_orders) AS o;

  INSERT INTO order_items (id, order_id, menu_item_id, restaurant_id, quantity, unit_price)
  SELECT
    i->>'id',
    i->>'order_id',
    i->>'menu_item_id',
    i->>'restaurant_id',
    (i->>'quantity')::int,
    (i->>'unit_price')::numeric
  FROM jsonb_array_elements(p_items) AS i;

  IF p_table_id IS NOT NULL AND p_table_id <> '' THEN
    UPDATE tables SET status = 'OCCUPIED'::public."TableStatus" WHERE id = p_table_id;
  END IF;
END;
$$;

-- Solo el service role (rutas API del servidor) puede ejecutarla. El cliente anónimo
-- no debe poder insertar pedidos arbitrarios saltándose la validación del route.
REVOKE ALL ON FUNCTION public.create_order_tx(jsonb, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_tx(jsonb, jsonb, text) TO service_role;
