/**
 * constants.ts — Constantes operativas y etiquetas de estado compartidas entre todas las apps.
 * Centraliza umbrales de stock crítico, tiempos de alerta y labels de estado en español.
 */

// Umbrales operativos compartidos entre todas las apps
export const LOW_STOCK_THRESHOLD      = 5;   // inventory/page.tsx
export const CRITICAL_STOCK_THRESHOLD = 5;   // kitchen-kds API
export const STALE_ORDER_MINUTES      = 3;   // local-dashboard escalation

// Etiquetas de estado de pedido (español)
export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING:   "Solicitado",
  VALIDATED: "Confirmado",
  PREPARING: "En preparación",
  READY:     "Listo",
  DELIVERED: "Entregado",
  REJECTED:  "Rechazado",
};

// Etiquetas de estado de mesa (español)
export const TABLE_STATUS_LABEL: Record<string, string> = {
  FREE:      "Libre",
  OCCUPIED:  "Ocupada",
  RESERVED:  "Reservada",
  CLEANING:  "Limpieza",
};
