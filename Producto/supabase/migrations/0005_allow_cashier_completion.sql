-- Allow cashier to mark orders as COMPLETED from any active state
CREATE OR REPLACE FUNCTION validate_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
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
