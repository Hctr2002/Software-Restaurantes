-- Allow cashier to mark orders as COMPLETED from any active state
-- Sincronizado con validate_order_transition para consistencia con el trigger original

CREATE OR REPLACE FUNCTION validate_order_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status != 'PENDING' THEN RAISE EXCEPTION 'Un pedido nuevo debe comenzar en PENDING'; END IF;
        RETURN NEW;
    END IF;

    IF OLD.status = NEW.status THEN RETURN NEW; END IF;

    CASE OLD.status
        WHEN 'PENDING' THEN
            IF NEW.status NOT IN ('VALIDATED', 'REJECTED') THEN
                RAISE EXCEPTION 'Transición inválida: PENDING -> %', NEW.status;
            END IF;
        WHEN 'VALIDATED' THEN
            IF NEW.status NOT IN ('PREPARING', 'COMPLETED', 'REJECTED') THEN
                RAISE EXCEPTION 'Transición inválida: VALIDATED -> %', NEW.status;
            END IF;
        WHEN 'PREPARING' THEN
            IF NEW.status NOT IN ('READY', 'COMPLETED', 'REJECTED') THEN
                RAISE EXCEPTION 'Transición inválida: PREPARING -> %', NEW.status;
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

-- Aseguramos que el trigger esté usando la función actualizada
DROP TRIGGER IF EXISTS tr_order_status_validation ON "orders";
CREATE TRIGGER tr_order_status_validation
BEFORE INSERT OR UPDATE ON "orders"
FOR EACH ROW EXECUTE FUNCTION validate_order_transition();
