ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS kitchen_preparing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bar_preparing     boolean NOT NULL DEFAULT false;
