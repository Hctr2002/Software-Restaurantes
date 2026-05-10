-- Migration: 0009_order_station_split
-- Replace cross-station flag logic with per-station sub-orders.
-- Each order now belongs to exactly one station (KITCHEN or BAR).

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS station TEXT CHECK (station IN ('KITCHEN', 'BAR'));

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS parent_order_id UUID;

CREATE INDEX IF NOT EXISTS idx_orders_station ON orders (station);
CREATE INDEX IF NOT EXISTS idx_orders_parent_order_id ON orders (parent_order_id);

-- Migrate existing non-terminal orders: set station based on their items.
-- Mixed orders (items from both stations) are left with station = NULL and
-- will continue to work under the old logic until they complete.
UPDATE orders o
SET station = subq.station
FROM (
  SELECT oi.order_id,
         MIN(c.target_station) AS station,
         COUNT(DISTINCT c.target_station) AS station_count
  FROM order_items oi
  JOIN menu_items mi ON mi.id = oi.menu_item_id
  JOIN categories  c  ON c.id  = mi.category_id
  GROUP BY oi.order_id
) subq
WHERE o.id = subq.order_id
  AND subq.station_count = 1
  AND o.status NOT IN ('DELIVERED', 'COMPLETED', 'REJECTED');
