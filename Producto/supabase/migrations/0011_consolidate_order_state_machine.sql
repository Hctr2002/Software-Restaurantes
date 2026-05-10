-- Migration: 0011_consolidate_order_state_machine
-- Versión definitiva de validate_order_transition que unifica:
--   - Transiciones originales (0001)
--   - Completion por caja desde VALIDATED/PREPARING (0005)
--   - INSERT con VALIDATED para garzón + PARCIAL (0007)
-- Las versiones anteriores (0005, 0007) sobrescribían la función con reglas
-- incompletas. Esta migración fija el estado final canónico.

CREATE OR REPLACE FUNCTION validate_order_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Clientes crean PENDING; garzón crea VALIDATED directamente
        IF NEW.status NOT IN ('PENDING', 'VALIDATED') THEN
            RAISE EXCEPTION 'Un pedido nuevo debe comenzar en PENDING o VALIDATED';
        END IF;
        RETURN NEW;
    END IF;

    IF OLD.status = NEW.status THEN RETURN NEW; END IF;

    CASE OLD.status
        WHEN 'PENDING' THEN
            IF NEW.status NOT IN ('VALIDATED', 'REJECTED') THEN
                RAISE EXCEPTION 'Transición inválida: PENDING -> %', NEW.status;
            END IF;
        WHEN 'VALIDATED' THEN
            -- Caja puede cerrar directamente desde VALIDATED (pago express)
            IF NEW.status NOT IN ('PREPARING', 'COMPLETED', 'REJECTED') THEN
                RAISE EXCEPTION 'Transición inválida: VALIDATED -> %', NEW.status;
            END IF;
        WHEN 'PREPARING' THEN
            -- Caja puede cerrar desde PREPARING; PARCIAL para órdenes mixtas parciales
            IF NEW.status NOT IN ('READY', 'PARCIAL', 'COMPLETED', 'REJECTED') THEN
                RAISE EXCEPTION 'Transición inválida: PREPARING -> %', NEW.status;
            END IF;
        WHEN 'PARCIAL' THEN
            IF NEW.status NOT IN ('READY', 'DELIVERED') THEN
                RAISE EXCEPTION 'Transición inválida: PARCIAL -> %', NEW.status;
            END IF;
        WHEN 'READY' THEN
            IF NEW.status NOT IN ('DELIVERED', 'COMPLETED', 'REJECTED') THEN
                RAISE EXCEPTION 'Transición inválida: READY -> %', NEW.status;
            END IF;
        WHEN 'DELIVERED' THEN
            IF NEW.status != 'COMPLETED' THEN
                RAISE EXCEPTION 'Transición inválida: DELIVERED -> %', NEW.status;
            END IF;
        WHEN 'COMPLETED' THEN
            RAISE EXCEPTION 'No se puede cambiar el estado de un pedido ya COMPLETED';
        WHEN 'REJECTED' THEN
            RAISE EXCEPTION 'No se puede cambiar el estado de un pedido ya REJECTED';
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear trigger para que use la versión consolidada
DROP TRIGGER IF EXISTS tr_order_status_validation ON orders;
CREATE TRIGGER tr_order_status_validation
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION validate_order_transition();
