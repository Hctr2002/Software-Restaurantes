-- Add gen_random_uuid() default to tables that were missing it.
-- Prisma handles uuid generation client-side, but direct Supabase JS inserts require a DB-level default.
ALTER TABLE orders     ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE order_items ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
