-- Fix order state machine:
-- 1. Allow INSERT with VALIDATED status (waiter creates orders directly as validated)
-- 2. Add PARCIAL transitions: PREPARING → PARCIAL, PARCIAL → READY/DELIVERED

CREATE OR REPLACE FUNCTION validate_order_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Customers create PENDING orders; waiters create VALIDATED orders directly
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
            IF NEW.status NOT IN ('PREPARING', 'REJECTED') THEN
                RAISE EXCEPTION 'Transición inválida: VALIDATED -> %', NEW.status;
            END IF;
        WHEN 'PREPARING' THEN
            IF NEW.status NOT IN ('READY', 'PARCIAL') THEN
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
