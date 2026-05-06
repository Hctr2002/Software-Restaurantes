-- Corrige el FK orders → tables para permitir eliminar mesas con historial.
--
-- El FK compuesto (table_id, restaurant_id) intentaba poner NULL en ambas
-- columnas al borrar una mesa, pero restaurant_id tiene NOT NULL constraint.
-- Solución: reemplazar por un FK simple solo en table_id con ON DELETE SET NULL.

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_table_id_restaurant_id_fkey;

ALTER TABLE orders
  ADD CONSTRAINT orders_table_id_fkey
    FOREIGN KEY (table_id)
    REFERENCES tables (id)
    ON DELETE SET NULL;
