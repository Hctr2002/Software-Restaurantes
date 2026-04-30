import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createServiceClient, ensureServiceConfig } from "@/lib/localApi";

function dayStart(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function monthStart(date: Date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function GET(req: NextRequest) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId } = auth;

  const now = new Date();
  const db = createServiceClient();

  // Fetch delivered orders of today — use unit_price (snapshot at order time)
  const { data: todayOrders } = await db
    .from("orders")
    .select("id, order_items(id, unit_price, menu_items(name))")
    .eq("restaurant_id", restaurantId)
    .eq("status", "DELIVERED")
    .gte("createdAt", dayStart(now));

  // Fetch delivered orders of this month
  const { data: monthOrders } = await db
    .from("orders")
    .select("id, order_items(id, unit_price)")
    .eq("restaurant_id", restaurantId)
    .eq("status", "DELIVERED")
    .gte("createdAt", monthStart(now));

  // Calculate ingresos del día
  const ingresos_dia = (todayOrders ?? []).reduce((sum: number, order: any) => {
    return sum + (order.order_items ?? []).reduce((s: number, item: any) => s + Number(item.unit_price ?? 0), 0);
  }, 0);

  // Calculate ingresos del mes
  const ingresos_mes = (monthOrders ?? []).reduce((sum: number, order: any) => {
    return sum + (order.order_items ?? []).reduce((s: number, item: any) => s + Number(item.unit_price ?? 0), 0);
  }, 0);

  // Ticket promedio del día
  const count_dia = todayOrders?.length ?? 0;
  const ticket_promedio = count_dia > 0 ? Math.round(ingresos_dia / count_dia) : 0;

  // Top 3 items más pedidos hoy
  const itemCount: Record<string, { name: string; count: number }> = {};
  (todayOrders ?? []).forEach((order: any) => {
    (order.order_items ?? []).forEach((item: any) => {
      const name = item.menu_items?.name;
      if (!name) return;
      if (!itemCount[name]) itemCount[name] = { name, count: 0 };
      itemCount[name].count++;
    });
  });

  const top_items = Object.values(itemCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return NextResponse.json({
    data: { ingresos_dia, ingresos_mes, ticket_promedio, top_items, pedidos_dia: count_dia },
  });
}
