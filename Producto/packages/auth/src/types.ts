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
  isActive: boolean;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryId: string | null;
  imageUrl: string | null;
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
};

export type OrderStatus = 'PENDING' | 'VALIDATED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'REJECTED';

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
  table?: TableRecord | null;
};

export type AlertType = 'HELP' | 'BILL' | 'ORDER_READY' | 'TABLE_CLEAN';

export type Alert = {
  id: string;
  restaurantId: string;
  tableId: string | null;
  type: AlertType;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type StatsData = {
  ingresos_dia: number;
  ingresos_mes: number;
  ticket_promedio: number;
  top_items: { name: string; count: number }[];
};
