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
  oldestCreatedAt: string;
};

export const TABLE_STATUSES = ["FREE", "OCCUPIED", "RESERVED", "CLEANING"];
export const ORDER_STATUSES = ["PENDING", "VALIDATED", "PREPARING", "READY", "DELIVERED", "REJECTED"];
