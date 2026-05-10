-- Migration: 0012_realtime_orders_replication
--
-- PROBLEMA: Los cambios de estado de pedidos (UPDATE) no llegan en tiempo real
-- al KDS ni al Bar Dashboard porque:
--
--   1. Sin REPLICA IDENTITY FULL, Supabase Realtime no puede evaluar filtros
--      sobre columnas no-PK (restaurant_id) en eventos UPDATE y DELETE.
--      Solo INSERT funciona. Por eso el KDS se actualiza al refrescar (fetch)
--      pero no en vivo.
--
--   2. La tabla no estaba en la publicación supabase_realtime.
--
-- SOLUCIÓN: habilitar FULL replica identity y añadir la tabla a la publicación.

ALTER TABLE orders REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END $$;
