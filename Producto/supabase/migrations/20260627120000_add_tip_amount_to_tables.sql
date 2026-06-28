-- Propina variable: monto de propina elegido por el cliente al pedir la cuenta.
-- En pesos (entero). 0 = sin monto fijo; si tip_included = true sin monto, la caja
-- cae al 10% por compatibilidad con el flujo del garzón.
ALTER TABLE "public"."tables"
  ADD COLUMN IF NOT EXISTS "tip_amount" integer DEFAULT 0;
