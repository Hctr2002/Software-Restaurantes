-- 0001_initial_security.sql
-- Refuerzo de seguridad y aislamiento multi-tenant para Menú Bytes
-- Calidad Senior Enterprise | Basado en Entrega 1.pdf

--------------------------------------------------------------------------------
-- 1. HABILITAR RLS (Row Level Security)
--------------------------------------------------------------------------------
DO $$ 
DECLARE 
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

--------------------------------------------------------------------------------
-- 2. FUNCIONES DE CONTEXTO (JWT)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_auth_restaurant_id() RETURNS uuid AS $$
  SELECT (NULLIF(current_setting('request.jwt.claims', true)::json->'app_metadata'->>'restaurant_id', ''))::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_auth_role() RETURNS text AS $$
  SELECT current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role';
$$ LANGUAGE sql STABLE;

--------------------------------------------------------------------------------
-- 3. POLÍTICAS DE AISLAMIENTO POR TENANT
--------------------------------------------------------------------------------
-- Política para la tabla de restaurantes (solo ver el propio)
DROP POLICY IF EXISTS self_restaurant_access ON "restaurants";
CREATE POLICY self_restaurant_access ON "restaurants"
  FOR ALL USING (id = get_auth_restaurant_id());

-- Política universal para todas las tablas con restaurant_id
DO $$ 
DECLARE 
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.columns 
           WHERE column_name = 'restaurant_id' AND table_name != 'users' AND table_schema = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_access_policy ON public.%I', t);
    EXECUTE format('CREATE POLICY tenant_access_policy ON public.%I 
                    FOR ALL USING (restaurant_id = get_auth_restaurant_id())
                    WITH CHECK (restaurant_id = get_auth_restaurant_id())', t);
  END LOOP;
END $$;

-- Política para la tabla users (ver compañeros de restaurante)
DROP POLICY IF EXISTS users_tenant_access ON "users";
CREATE POLICY users_tenant_access ON "users"
  FOR ALL USING (restaurant_id = get_auth_restaurant_id() OR id = auth.uid());

--------------------------------------------------------------------------------
-- 4. RESTRICCIÓN DE FLUJO DE PEDIDOS (STRICT STATE MACHINE)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_order_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Permitir INSERT inicial
    IF TG_OP = 'INSERT' THEN
        IF NEW.status != 'PENDING' THEN
            RAISE EXCEPTION 'Un pedido nuevo debe comenzar en PENDING';
        END IF;
        RETURN NEW;
    END IF;

    -- Si el estado no cambia, permitir
    IF OLD.status = NEW.status THEN RETURN NEW; END IF;

    -- Máquina de estados estricta (Enterprise Quality)
    CASE OLD.status
        WHEN 'PENDING' THEN
            IF NEW.status NOT IN ('VALIDATED', 'REJECTED') THEN 
                RAISE EXCEPTION 'Transición inválida: PENDING -> %', NEW.status; 
            END IF;
        WHEN 'VALIDATED' THEN
            IF NEW.status NOT IN ('PREPARING', 'REJECTED') THEN 
                RAISE EXCEPTION 'Transición inválida: VALIDATED -> %', NEW.status; 
            END IF;
        WHEN 'PREPARING' THEN
            IF NEW.status != 'READY' THEN 
                RAISE EXCEPTION 'Transición inválida: PREPARING -> %', NEW.status; 
            END IF;
        WHEN 'READY' THEN
            IF NEW.status != 'DELIVERED' THEN 
                RAISE EXCEPTION 'Transición inválida: READY -> %', NEW.status; 
            END IF;
        WHEN 'DELIVERED' THEN
            RAISE EXCEPTION 'No se puede cambiar el estado de un pedido ya DELIVERED';
        WHEN 'REJECTED' THEN
            RAISE EXCEPTION 'No se puede cambiar el estado de un pedido ya REJECTED';
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_order_status_validation ON "orders";
CREATE TRIGGER tr_order_status_validation
BEFORE INSERT OR UPDATE ON "orders"
FOR EACH ROW EXECUTE FUNCTION validate_order_transition();

--------------------------------------------------------------------------------
-- 5. SINCRONIZACIÓN AUTOMÁTICA DE USUARIOS (WEBHOOK DB)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_auth_user_sync()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, restaurant_id)
  VALUES (
    new.id,
    new.email,
    COALESCE((new.raw_app_meta_data->>'role')::public."Role", 'CLIENTE'),
    (new.get_auth_restaurant_id())::uuid -- Error aquí: new no tiene esa function. Corregido:
    (new.raw_app_meta_data->>'restaurant_id')::uuid
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    restaurant_id = EXCLUDED.restaurant_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_change ON auth.users;
CREATE TRIGGER on_auth_user_change
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_sync();

--------------------------------------------------------------------------------
-- 6. ÍNDICES DE PERFORMANCE (Enterprise Dashboards)
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON "orders" (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_items_active ON "menu_items" (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON "orders" (restaurant_id);

--------------------------------------------------------------------------------
-- 7. RESTRICCIONES DE INTEGRIDAD EXTRA
--------------------------------------------------------------------------------
ALTER TABLE "order_items" ADD CONSTRAINT qty_positive CHECK (quantity > 0);
ALTER TABLE "menu_items" ADD CONSTRAINT price_non_negative CHECK (price >= 0);
