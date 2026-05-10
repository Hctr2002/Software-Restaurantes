-- Add PARCIAL to OrderStatus enum
-- PARCIAL means the order has been partially delivered (one station done, other still working)
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PARCIAL';
