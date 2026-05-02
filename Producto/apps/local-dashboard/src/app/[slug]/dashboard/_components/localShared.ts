// Types reflect Supabase REST API column names.
export type AlertType = 'TABLE_ISSUE' | 'BILL_REQUEST' | 'STOCK_SHORTAGE' | 'HELP_REQUEST' | 'GENERAL';

export type Alert = {
  id: string;
  restaurant_id: string;
  user_id: string | null;
  user_email: string | null;
  type: AlertType;
  message: string;
  table_number: number | null;
  menu_item_id: string | null;
  menu_item_name: string | null;
  status: 'PENDING' | 'RESOLVED';
  created_at: string;
  resolved_at: string | null;
  resolved_by_email: string | null;
};


// Fields with @map() in Prisma are aliased to camelCase in the API routes.

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryId: string | null;      // DB: category_id — aliased in GET /api/local/menu
  image_url: string | null;
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
  menuItemId: string;             // DB: menu_item_id — aliased in GET /api/local/orders
  unitPrice: number;              // DB: unit_price  — aliased in GET /api/local/orders
  quantity: number;
  menu_items?: { name: string } | null;
};

export type Order = {
  id: string;
  tableId: string | null;         // DB: table_id — aliased in GET /api/local/orders
  userId: string | null;          // DB: user_id — aliased in GET /api/local/orders
  status: string;
  createdAt: string;              // DB: createdAt (no @map in Prisma — kept as-is)
  tables?: { number: number } | null;
  users?: { email: string } | null;
  order_items?: OrderItem[];
};

export type Inventory = {
  id: string;
  name: string;
  stock: number;
  unit: string;
  restaurant_id: string;
  createdAt: string;
  updatedAt: string;
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

export type LocalUserRecord = {
  id: string;
  email: string;
  role: string;
  restaurant_id: string;
  createdAt: string;
};

// Matches Prisma Role enum (SUPER_ADMIN y CLIENTE se gestionan desde otros paneles)
export const LOCAL_ROLES = ["ADMIN", "GARZON", "COCINA", "CAJERO"];

export const TABLE_STATUSES = ["FREE", "OCCUPIED", "RESERVED"];
export const ORDER_STATUSES = ["PENDING", "VALIDATED", "PREPARING", "READY", "DELIVERED", "REJECTED"];

export function formatDate(value: string | undefined | null) {
  if (!value) return "—";
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

export function timeAgo(value: string): string {
  const diff = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (diff < 1) return "Hace un momento";
  if (diff === 1) return "Hace 1 min";
  if (diff < 60) return `Hace ${diff} min`;
  const hrs = Math.floor(diff / 60);
  return `Hace ${hrs}h ${diff % 60}min`;
}
