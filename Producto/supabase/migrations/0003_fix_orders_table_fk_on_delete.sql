-- Corrige el FK orders → tables para permitir eliminar mesas con historial.
-- La constraint compuesta (table_id, restaurant_id) se elimina y se recrea
-- con ON DELETE SET NULL, de modo que al borrar una mesa las órdenes
-- históricas conservan sus datos pero sueltan la referencia a la mesa.

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_table_id_restaurant_id_fkey;

ALTER TABLE orders
  ADD CONSTRAINT orders_table_id_restaurant_id_fkey
    FOREIGN KEY (table_id, restaurant_id)
    REFERENCES tables (id, restaurant_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
