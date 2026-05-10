-- Migration: 0010_bar_rls_and_settings_atomic
-- 1. RLS restrictiva para el rol BAR en la tabla orders
-- 2. Función atómica para evitar race condition en kds_settings
-- 3. Documentación del ciclo de vida de parent_order_id

--------------------------------------------------------------------------------
-- 1. RLS RESTRICTIVA PARA ROL BAR EN ORDERS
-- La policy genérica tenant_access_policy permite ver todos los pedidos del
-- restaurante. Esta policy RESTRICTIVA limita al rol BAR a solo ver órdenes
-- de su estación (BAR) y pedidos legacy sin station asignada.
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS bar_can_view_bar_orders ON orders;

CREATE POLICY bar_can_view_bar_orders ON orders
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (
    get_auth_role() != 'BAR'
    OR (
      restaurant_id::text = get_auth_restaurant_id()
      AND (station = 'BAR' OR station IS NULL)
    )
  );

-- BAR tampoco puede INSERT/UPDATE pedidos de otras estaciones
DROP POLICY IF EXISTS bar_write_restriction ON orders;

CREATE POLICY bar_write_restriction ON orders
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    get_auth_role() != 'BAR'
    OR (
      restaurant_id::text = get_auth_restaurant_id()
      AND (station = 'BAR' OR station IS NULL)
    )
  )
  WITH CHECK (
    get_auth_role() != 'BAR'
    OR (
      restaurant_id::text = get_auth_restaurant_id()
      AND (station = 'BAR' OR station IS NULL)
    )
  );

--------------------------------------------------------------------------------
-- 2. FUNCIÓN ATÓMICA PARA UPSERT DE KDS_SETTINGS
-- Elimina la race condition cuando Cocina y Barra guardan simultáneamente.
-- Usa SELECT FOR UPDATE para bloquear la fila durante la transacción.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION upsert_kds_settings_safe(
  p_restaurant_id UUID,
  p_station       TEXT,
  p_settings      JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_settings JSONB;
  v_final_settings   JSONB;
BEGIN
  -- Bloquear la fila existente para evitar escrituras concurrentes
  SELECT settings
    INTO v_current_settings
    FROM kds_settings
   WHERE restaurant_id = p_restaurant_id
     FOR UPDATE;

  IF NOT FOUND THEN
    v_current_settings := '{}'::JSONB;
  END IF;

  -- Merge: preservar otras estaciones, actualizar solo p_station
  v_final_settings := v_current_settings || jsonb_build_object(p_station, p_settings);

  INSERT INTO kds_settings (restaurant_id, settings, updated_at)
  VALUES (p_restaurant_id, v_final_settings, NOW())
  ON CONFLICT (restaurant_id)
  DO UPDATE SET
    settings   = EXCLUDED.settings,
    updated_at = EXCLUDED.updated_at;

  RETURN v_final_settings -> p_station;
END;
$$;

--------------------------------------------------------------------------------
-- 3. DOCUMENTACIÓN: CICLO DE VIDA DE parent_order_id
-- (Comentario de tabla para referencia futura)
--------------------------------------------------------------------------------
COMMENT ON COLUMN orders.parent_order_id IS
'Vincula sub-pedidos generados al dividir una orden mixta por estación.
 Ciclo de vida:
   1. Cliente ordena [Hamburguesa + Jugo] → se crean 2 registros independientes
      - KITCHEN: station=KITCHEN, parent_order_id=NULL (es el padre)
      - BAR:     station=BAR, parent_order_id=KITCHEN.id (es el hijo)
   2. Garzón valida → ambos sub-pedidos pasan a VALIDATED
   3. Cocina y Barra avanzan independientemente en su pipeline
   4. Garzón entrega por table_id → ambos se marcan DELIVERED
   5. Cajero cierra → ambos pasan a COMPLETED
 Reglas:
   - Nunca borres un sub-pedido sin borrar su gemelo
   - Para auditoría: orders.parent_order_id permite rastrear la pareja';

COMMENT ON COLUMN orders.station IS
'Estación propietaria del pedido: KITCHEN o BAR.
 NULL indica un pedido legacy creado antes de la migración 0009 (compatibilidad).
 Los pedidos nuevos SIEMPRE deben tener station asignada.';
