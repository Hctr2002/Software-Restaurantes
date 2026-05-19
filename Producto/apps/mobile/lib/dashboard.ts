import { supabase } from './supabase';

export type DashboardStats = {
  ingresos_dia: number;
  ingresos_mes: number;
  ticket_promedio: number;
  pedidos_dia: number;
  activos: number;
  flowCounts: {
    PENDING: number;
    VALIDATED: number;
    PREPARING: number;
    READY: number;
  };
  avgCycleMin: number | null;
  top_items: { name: string; count: number }[];
};

export type DashboardOrder = {
  id: string;
  table_number: number | string;
  status: string;
  createdAt: string;
};

function dayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function monthStart() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function fetchDashboardStats(restaurantId: string): Promise<DashboardStats> {

  // Todas las órdenes del día para métricas de flujo y tiempo de ciclo
  const { data: allTodayOrders } = await supabase
    .from('orders')
    .select('id, status, createdAt, ready_at, order_items(unit_price, quantity, menu_items(name))')
    .eq('restaurant_id', restaurantId)
    .gte('createdAt', dayStart());

  // Órdenes entregadas/completadas del mes (para ingresos)
  const { data: monthOrders } = await supabase
    .from('orders')
    .select('id, order_items(unit_price, quantity)')
    .eq('restaurant_id', restaurantId)
    .in('status', ['DELIVERED', 'COMPLETED'])
    .gte('createdAt', monthStart());

  // Conteo de órdenes activas (en progreso, excluye estados terminales)
  const { count: activosCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)
    .in('status', ['PENDING', 'VALIDATED', 'PREPARING', 'READY']);

  // Órdenes exitosas del día para el cálculo de ingresos
  const todaySuccessful = (allTodayOrders ?? []).filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status));

  const ingresos_dia = todaySuccessful.reduce((sum, order: any) => {
    return sum + (order.order_items ?? []).reduce((s: number, item: any) => s + (Number(item.unit_price ?? 0) * Number(item.quantity ?? 1)), 0);
  }, 0);

  const ingresos_mes = (monthOrders ?? []).reduce((sum, order: any) => {
    return sum + (order.order_items ?? []).reduce((s: number, item: any) => s + (Number(item.unit_price ?? 0) * Number(item.quantity ?? 1)), 0);
  }, 0);

  const count_dia = todaySuccessful.length;
  const ticket_promedio = count_dia > 0 ? Math.round(ingresos_dia / count_dia) : 0;

  // Conteo por estado de flujo
  const flowCounts = {
    PENDING: (allTodayOrders ?? []).filter(o => o.status === 'PENDING').length,
    VALIDATED: (allTodayOrders ?? []).filter(o => o.status === 'VALIDATED').length,
    PREPARING: (allTodayOrders ?? []).filter(o => o.status === 'PREPARING').length,
    READY: (allTodayOrders ?? []).filter(o => o.status === 'READY').length,
  };

  // Tiempo de ciclo promedio del día
  const deliveredWithTime = (allTodayOrders ?? []).filter(o => (o.status === 'DELIVERED' || o.status === 'READY') && o.ready_at && o.createdAt);
  const avgCycleMin = deliveredWithTime.length > 0
    ? Math.round(deliveredWithTime.reduce((s, o) => {
      return s + (new Date(o.ready_at!).getTime() - new Date(o.createdAt).getTime()) / 60000;
    }, 0) / deliveredWithTime.length)
    : null;

  const itemCount: Record<string, { name: string; count: number }> = {};
  todaySuccessful.forEach((order: any) => {
    (order.order_items ?? []).forEach((item: any) => {
      const name = item.menu_items?.name;
      if (!name) return;
      if (!itemCount[name]) itemCount[name] = { name, count: 0 };
      itemCount[name].count += Number(item.quantity ?? 1);
    });
  });

  const top_items = Object.values(itemCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return {
    ingresos_dia,
    ingresos_mes,
    ticket_promedio,
    pedidos_dia: count_dia,
    activos: activosCount ?? 0,
    flowCounts,
    avgCycleMin,
    top_items
  };
}

export async function fetchRecentOrders(restaurantId: string): Promise<DashboardOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, createdAt, tables(number)')
    .eq('restaurant_id', restaurantId)
    .order('createdAt', { ascending: false })
    .limit(5);

  if (error) throw error;

  return (data ?? []).map((o: any) => ({
    id: o.id,
    status: o.status,
    createdAt: o.createdAt,
    table_number: o.tables?.number ?? 'S/N'
  }));
}

export type TableData = {
  id: string;
  number: number | string;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';
};

export async function fetchTables(restaurantId: string): Promise<TableData[]> {
  const { data, error } = await supabase
    .from('tables')
    .select('id, number, status')
    .eq('restaurant_id', restaurantId)
    .order('number', { ascending: true });

  if (error) throw error;
  return data || [];
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
}

export function timeAgo(value: string): string {
  const diff = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (diff < 1) return "Ahora";
  if (diff === 1) return "1 min";
  if (diff < 60) return `${diff} min`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return `${hrs}h ${diff % 60}m`;
  return `${Math.floor(hrs / 24)}d`;
}
