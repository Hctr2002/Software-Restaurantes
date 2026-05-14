-- Migración: 0013_rpc_completar_pago_mesa
-- Objetivo: Centralizar la lógica de cierre de pago en la base de datos.
--
-- Esta función reemplaza el bucle de actualizaciones secuenciales que existía
-- en el cliente (cashier-dashboard). Al ejecutarse dentro de una transacción
-- atómica de Postgres, garantiza que si cualquier parte falla, ningún cambio
-- queda aplicado. Elimina el riesgo de estados inconsistentes por pérdida
-- de conexión o errores parciales en el cliente.
--
-- Parámetros:
--   p_order_ids  - Array con los IDs de las órdenes a cerrar.
--   p_table_id   - (Opcional) ID de la mesa a pasar a estado CLEANING.
--
-- Comportamiento:
--   - Ignora órdenes que ya están en COMPLETED o REJECTED.
--   - Actualiza el resto directamente a COMPLETED en una sola operación.
--     El trigger validate_order_transition (0011) permite esta transición
--     desde VALIDATED, PREPARING y READY.
--   - Si p_table_id se provee, actualiza la mesa a CLEANING y limpia
--     el flag bill_requested.
--
-- Compatibilidad con entregas futuras:
--   - Diseñada para ser invocada también desde un webhook de pasarela de pago
--     o desde una Edge Function sin modificar su firma.
--   - Acepta un array de IDs en lugar del ID de mesa para soportar
--     cuentas divididas y mesas fusionadas.

CREATE OR REPLACE FUNCTION completar_pago_mesa(
    p_order_ids TEXT[],
    p_table_id  TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Actualizar a COMPLETED todas las órdenes del array
    -- que aún no estén en un estado terminal.
    UPDATE orders
    SET status = 'COMPLETED'
    WHERE id = ANY(p_order_ids)
      AND status NOT IN ('COMPLETED', 'REJECTED');

    -- Actualizar a CLEANING todas las mesas involucradas.
    -- Buscamos las mesas directas de las órdenes y también las mesas
    -- que compartan la misma sesión (en caso de fusión).
    UPDATE tables
    SET
        status         = 'CLEANING',
        bill_requested = false,
        current_session_id = NULL
    WHERE id IN (
        SELECT DISTINCT table_id 
        FROM orders 
        WHERE id = ANY(p_order_ids) AND table_id IS NOT NULL
    ) OR current_session_id IN (
        SELECT DISTINCT session_id 
        FROM orders 
        WHERE id = ANY(p_order_ids) AND session_id IS NOT NULL
    ) OR id = p_table_id;
END;
$$;

-- Revocar acceso público y concederlo solo al rol autenticado.
-- Solo usuarios con sesión válida pueden invocar esta función.
REVOKE ALL ON FUNCTION completar_pago_mesa(TEXT[], TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION completar_pago_mesa(TEXT[], TEXT) TO authenticated;
