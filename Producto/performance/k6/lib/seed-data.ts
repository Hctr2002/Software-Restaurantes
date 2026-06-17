// Ids deterministas del restaurante demo definido en supabase/seed.sql.
// Los scripts de k6 construyen los ids con el mismo patrón sin consultar la BD.

export const RESTAURANT_ID = '00000000-0000-4000-a000-000000000001';

export const TABLE_COUNT = 100; // mesas 1..100
export const KITCHEN_ITEMS = 10; // ítems de cocina 1..10
export const BAR_ITEMS = 10; // ítems de barra 1..10

const pad = (n: number): string => String(n).padStart(12, '0');

/** id de mesa para el número n (1..TABLE_COUNT) */
export const tableId = (n: number): string => `00000000-0000-4000-b000-${pad(n)}`;

/** id de ítem de cocina n (1..KITCHEN_ITEMS) */
export const kitchenItemId = (n: number): string => `00000000-0000-4000-c000-${pad(n)}`;

/** id de ítem de barra n (1..BAR_ITEMS) */
export const barItemId = (n: number): string => `00000000-0000-4000-d000-${pad(n)}`;

/** precio sembrado para un ítem de cocina n */
export const kitchenPrice = (n: number): number => 1000 + n * 100;

/** precio sembrado para un ítem de barra n */
export const barPrice = (n: number): number => 2000 + n * 100;
