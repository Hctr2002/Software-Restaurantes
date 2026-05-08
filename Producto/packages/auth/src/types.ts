import { SupabaseClient } from '@supabase/supabase-js';

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'GARZON' | 'COCINA' | 'CAJERO' | 'CLIENTE';

export type User = {
  id: string;
  email: string;
  role: Role;
  restaurantId: string | null;
};

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
};

export type Category = {
  id: string;
  name: string;
  restaurantId: string;
  is_active: boolean;
  isActive: boolean;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryId: string | null;
  image_url: string | null;
  imageUrl: string | null;
  is_active: boolean;
  isActive: boolean;
  restaurantId: string;
  categories?: { name: string } | null;
};

export type TableStatus = 'FREE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';

export type TableRecord = {
  id: string;
  number: number;
  label: string | null;
  status: TableStatus;
  qrData: string | null;
  restaurantId: string;
  billRequested: boolean;
  helpRequested: boolean;
};

export type OrderItem = {
  id: string;
  orderId: string;
  menuItemId: string;
  restaurantId: string;
  unitPrice: number;
  quantity: number;
  notes?: string | null;
  menuItem?: MenuItem | null;
  menu_items?: MenuItem | null;
  unit_price?: number;
  menu_item_id?: string;
};

export type OrderStatus = 'PENDING' | 'VALIDATED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'COMPLETED' | 'REJECTED';

export type Order = {
  id: string;
  tableId: string | null;
  restaurantId: string;
  userId: string | null;
  sessionId: string | null;
  status: OrderStatus;
  notes: string | null;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  validatedAt?: string | null;
  preparingAt?: string | null;
  readyAt?: string | null;
  orderItems?: OrderItem[];
  order_items?: OrderItem[];
  table?: TableRecord | null;
  tables?: TableRecord | null;
  users?: { email: string } | null;
};

export type AlertType = 'TABLE_ISSUE' | 'BILL_REQUEST' | 'STOCK_SHORTAGE' | 'HELP_REQUEST' | 'GENERAL';

export type Alert = {
  id: string;
  restaurantId: string;
  tableId: string | null;
  type: AlertType;
  message: string;
  status: 'PENDING' | 'RESOLVED';
  created_at: string;
  resolved_at?: string | null;
  resolved_by_email?: string | null;
  user_email: string | null;
  table_number?: string | number | null;
  menu_item_id?: string | null;
  menu_item_name?: string | null;
};

export type StatsData = {
  ingresos_dia: number;
  ingresos_mes: number;
  ticket_promedio: number;
  top_items: { name: string; count: number }[];
};

export type Inventory = {
  id: string;
  restaurantId: string;
  name: string;
  stock: number;
  unit: string;
  minStock: number | null;
  updatedAt: string;
};

export type LocalUserRecord = {
  id: string;
  email: string;
  role: Role;
  restaurantId: string | null;
  createdAt: string;
  name?: string | null;
};
