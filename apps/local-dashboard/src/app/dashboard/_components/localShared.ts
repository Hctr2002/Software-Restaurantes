export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  is_active: boolean;
  restaurant_id: string;
  categories?: { name: string } | null;
};

export type TableRecord = {
  id: string;
  number: number;
  label: string | null;
  status: string;
  restaurant_id: string;
};

export type OrderItem = {
  id: string;
  menu_item_id: string;
  menu_items?: { name: string; price: number } | null;
};

export type Order = {
  id: string;
  table_id: string | null;
  status: string;
  created_at: string;
  tables?: { number: number } | null;
  order_items?: OrderItem[];
};

export type Category = {
  id: string;
  name: string;
  is_active: boolean;
  restaurant_id: string;
};

export type StatsData = {
  ingresos_dia: number;
  ingresos_mes: number;
  ticket_promedio: number;
  top_items: { name: string; count: number }[];
};

export const TABLE_STATUSES = ["AVAILABLE", "OCCUPIED", "RESERVED"];
export const ORDER_STATUSES = ["PENDING", "PREPARING", "READY", "DELIVERED"];

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha inválida";
  return date.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(value);
}
