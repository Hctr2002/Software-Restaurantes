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

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryId: string | null;
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
  qrData: string | null;
  restaurant_id: string;
  bill_requested: boolean;
  help_requested: boolean;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string;
  unit_price: number;
  quantity: number;
  notes?: string | null;
  menu_items?: { name: string } | null;
};

export type Order = {
  id: string;
  table_id: string | null;
  restaurant_id: string;
  user_id: string | null;
  session_id: string | null;
  status: string;
  notes: string | null;
  total_amount: number;
  createdAt: string;
  validated_at?: string | null;
  preparing_at?: string | null;
  ready_at?: string | null;
  table?: { id: string; number: number } | null;
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
