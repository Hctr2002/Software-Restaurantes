/**
 * Utility functions for Reports logic in the mobile app
 */

export function diffMinutes(a: string | null | undefined, b: string | null | undefined): number | null {
  if (!a || !b) return null;
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}

export function avgOrNull(vals: number[]): number {
  if (!vals.length) return 0;
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

export function todayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatShortDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-CL", {
    weekday: "short", day: "2-digit", month: "2-digit",
  });
}

export function orderItemTotal(it: any): number {
  return Number(it.unitPrice ?? 0) * (it.quantity ?? 1);
}

export function processDailyReports(orders: any[], from: string, to: string) {
  const dayMap: Record<string, { orders: number; revenue: number }> = {};
  const cursor = new Date(from + "T12:00:00");
  const toDate = new Date(to + "T12:00:00");
  
  while (cursor <= toDate) {
    dayMap[cursor.toISOString().slice(0, 10)] = { orders: 0, revenue: 0 };
    cursor.setDate(cursor.getDate() + 1);
  }

  orders.forEach((order) => {
    const key = order.createdAt.slice(0, 10);
    if (!dayMap[key]) return;
    const total = (order.order_items ?? []).reduce((s: number, it: any) => s + orderItemTotal(it), 0);
    dayMap[key].orders++;
    dayMap[key].revenue += total;
  });

  return Object.entries(dayMap).map(([date, v]) => ({
    date,
    orders: v.orders,
    revenue: v.revenue,
    avg: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0,
  }));
}

export function processTopItems(orders: any[]) {
  const itemMap: Record<string, { count: number; revenue: number }> = {};
  orders.forEach((order) => {
    (order.order_items ?? []).forEach((it: any) => {
      const name = it.menu_items?.name;
      if (!name) return;
      if (!itemMap[name]) itemMap[name] = { count: 0, revenue: 0 };
      itemMap[name].count += it.quantity || 1;
      itemMap[name].revenue += orderItemTotal(it);
    });
  });

  return Object.entries(itemMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export function processTableReports(orders: any[]) {
  const tblMap: Record<number, { orders: number; revenue: number }> = {};
  orders.forEach((order) => {
    const num = order.tables?.number;
    if (!num) return;
    if (!tblMap[num]) tblMap[num] = { orders: 0, revenue: 0 };
    const total = (order.order_items ?? []).reduce((s: number, it: any) => s + orderItemTotal(it), 0);
    tblMap[num].orders++;
    tblMap[num].revenue += total;
  });

  return Object.entries(tblMap)
    .map(([number, v]) => ({ number: Number(number), ...v }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function processStaffReports(orders: any[]) {
  const garzonMap: Record<string, { orders: number; revenue: number }> = {};
  orders.forEach((order) => {
    const email = order.users?.email;
    if (!email) return;
    if (!garzonMap[email]) garzonMap[email] = { orders: 0, revenue: 0 };
    const total = (order.order_items ?? []).reduce((s: number, it: any) => s + orderItemTotal(it), 0);
    garzonMap[email].orders++;
    garzonMap[email].revenue += total;
  });

  return Object.entries(garzonMap)
    .map(([email, v]) => ({ email, ...v }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function buildTimingStats(orders: any[]): any[] {
  const map = new Map<string, { val: number[]; kit: number[]; tot: number[] }>();

  for (const order of orders) {
    if (!order.readyAt) continue;
    const cat = order.order_items?.[0]?.menu_items?.categories?.name ?? "Sin categoría";

    if (!map.has(cat)) map.set(cat, { val: [], kit: [], tot: [] });
    const g = map.get(cat)!;

    const valTime = diffMinutes(order.createdAt, order.validatedAt);
    const kitTime = diffMinutes(order.validatedAt, order.readyAt);
    const totTime = diffMinutes(order.createdAt, order.readyAt);

    if (valTime !== null && valTime >= 0) g.val.push(valTime);
    if (kitTime !== null && kitTime >= 0) g.kit.push(kitTime);
    if (totTime !== null && totTime >= 0) g.tot.push(totTime);
  }

  return Array.from(map.entries())
    .map(([category, g]) => ({
      category,
      validationMin: avgOrNull(g.val),
      kitchenMin:    avgOrNull(g.kit),
      totalMin:      avgOrNull(g.tot),
      count:         g.tot.length,
    }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.kitchenMin - a.kitchenMin);
}
