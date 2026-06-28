/**
 * dashboardTypes.ts — Tipos locales del package @menu-bites/ui para el dashboard.
 * Re-exporta los tipos de @menu-bites/auth y extiende Order con aliases de compatibilidad.
 * TableGroup: agrupación de órdenes por mesa usada en el terminal del garzón y la caja.
 */

import { Order as AuthOrder, OrderItem as AuthOrderItem, TableRecord as AuthTableRecord } from "@menu-bites/auth";

export type StatsData = {
  ingresos_dia: number;
  ingresos_mes: number;
  ticket_promedio: number;
  top_items: { name: string; count: number }[];
  pedidos_dia?: number;
};

export type TableRecord = AuthTableRecord;
export type OrderItem = AuthOrderItem;
export type Order = AuthOrder & {
  // Alias de compatibilidad si son necesarios
  total_amount?: number;
  session_id?: string | null;
  validated_at?: string | null;
  preparing_at?: string | null;
  ready_at?: string | null;
};

export type TableGroup = {
  key: string;
  tableId: string | null;
  sessionId: string | null;
  tableNumber: number | null;
  orders: Order[];
  total: number;
  billRequested: boolean;
  tipIncluded: boolean;
  /** Monto de propina elegido por el cliente. 0/ausente = sin monto fijo (usar fallback 10% si tipIncluded). */
  tipAmount?: number;
  oldestCreatedAt: string;
};

/** Tasa de propina por defecto cuando solo se marcó tip_included (flujo garzón/legacy), sin monto fijo. */
export const DEFAULT_TIP_RATE = 0.1;

/**
 * Propina efectiva a cobrar: si el cliente fijó un monto (tipAmount > 0) se usa ese;
 * si no, y la propina está incluida, se cae al 10% del total (compatibilidad con el flujo del garzón).
 */
export function effectiveTip(total: number, tipIncluded: boolean, tipAmount?: number | null): number {
  if (tipAmount && tipAmount > 0) return Math.round(tipAmount);
  return tipIncluded ? Math.round(total * DEFAULT_TIP_RATE) : 0;
}

/** Porcentaje que representa la propina respecto al consumo, redondeado. */
export function tipPercent(total: number, tip: number): number {
  return total > 0 ? Math.round((tip / total) * 100) : 0;
}

export const TABLE_STATUSES = ["FREE", "OCCUPIED", "RESERVED", "CLEANING"];
export const ORDER_STATUSES = ["PENDING", "VALIDATED", "PREPARING", "READY", "DELIVERED", "REJECTED"];
