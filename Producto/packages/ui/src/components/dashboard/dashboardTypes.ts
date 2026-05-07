export type StatsData = {
  ingresos_dia: number;
  ingresos_mes: number;
  ticket_promedio: number;
  top_items: { name: string; count: number }[];
  pedidos_dia?: number;
};

export type TableRecord = {
  id: string;
  number: number;
  label: string | null;
  status: string;
  qrData?: string | null;
  restaurant_id?: string;
};

export type OrderItem = {
  id: string;
  menuItemId: string;
  unitPrice: number;
  quantity: number;
  menu_items?: { name: string } | null;
};

export type Order = {
  id: string;
  tableId?: string | null; // UI compatibility
  table_id?: string | null; // Database compatibility
  userId?: string | null;
  user_id?: string | null;
  status: string;
  createdAt: string;
  total_amount?: number;
  session_id?: string | null;
  validated_at?: string | null;
  preparing_at?: string | null;
  ready_at?: string | null;
  table?: { number: number } | null;
  tables?: { id: string; number: number } | null;
  users?: { email: string } | null;
  order_items?: OrderItem[];
};

export type TableGroup = {
  key: string;
  tableId: string | null;
  sessionId: string | null;
  tableNumber: number | null;
  orders: Order[];
  total: number;
  billRequested: boolean;
  oldestCreatedAt: string;
};

export const TABLE_STATUSES = ["FREE", "OCCUPIED", "RESERVED", "CLEANING"];
export const ORDER_STATUSES = ["PENDING", "VALIDATED", "PREPARING", "READY", "DELIVERED", "REJECTED"];
