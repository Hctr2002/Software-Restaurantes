-- ============================================================
-- RESET: Elimina todos los objetos del schema public de Testing
-- para luego aplicar el schema exacto de Production
-- ============================================================

-- 1. Eliminar todas las tablas con CASCADE
-- (también elimina políticas RLS, constraints, índices, triggers de tabla)
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', t);
  END LOOP;
END $$;

-- 2. Eliminar funciones que existen en Testing pero NO en Production
DROP FUNCTION IF EXISTS public.rls_auto_enable() CASCADE;
DROP FUNCTION IF EXISTS public.upsert_kds_settings_safe(uuid, text, jsonb) CASCADE;

-- 3. Eliminar tipos/enums que existen en Testing pero NO en Production
DROP TYPE IF EXISTS public."AlertStatus" CASCADE;

-- 4. Eliminar funciones existentes que serán recreadas por el dump de Production
-- (para evitar conflictos de firma o dependencias colgantes)
DROP FUNCTION IF EXISTS public.get_auth_restaurant_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_auth_role() CASCADE;
DROP FUNCTION IF EXISTS public.handle_auth_user_sync() CASCADE;
DROP FUNCTION IF EXISTS public.handle_active_theme() CASCADE;
DROP FUNCTION IF EXISTS public.validate_order_status_transition() CASCADE;
DROP FUNCTION IF EXISTS public.completar_pago_mesa(text[], text) CASCADE;
DROP FUNCTION IF EXISTS public.reset_table_on_payment() CASCADE;
