/**
 * /api/local/stats — KPIs del día y del mes para el dashboard principal.
 * GET: Calcula ingresos del día, del mes, ticket promedio y top 3 ítems más pedidos hoy.
 * Considera solo órdenes DELIVERED o COMPLETED y usa unit_price (snapshot al momento del pedido).
 */
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

  // Órdenes entregadas del día — usa unit_price (precio al momento del pedido)
  const { data: todayOrders } = await db
    .from("orders")
    .select("id, order_items(id, unit_price, quantity, menu_items(name))")
    .eq("restaurant_id", restaurantId)
    .in("status", ["DELIVERED", "COMPLETED"])
    .gte("createdAt", dayStart(now));

  // Órdenes entregadas del mes
  const { data: monthOrders } = await db
    .from("orders")
    .select("id, order_items(id, unit_price, quantity)")
    .eq("restaurant_id", restaurantId)
    .in("status", ["DELIVERED", "COMPLETED"])
    .gte("createdAt", monthStart(now));

  // Cálculo de ingresos del día
  const ingresos_dia = (todayOrders ?? []).reduce((sum: number, order: any) => {
    return sum + (order.order_items ?? []).reduce((s: number, item: any) =>
      s + (Number(item.unit_price ?? 0) * Number(item.quantity ?? 1)), 0);
  }, 0);

  // Cálculo de ingresos del mes
  const ingresos_mes = (monthOrders ?? []).reduce((sum: number, order: any) => {
    return sum + (order.order_items ?? []).reduce((s: number, item: any) =>
      s + (Number(item.unit_price ?? 0) * Number(item.quantity ?? 1)), 0);
  }, 0);

  // Ticket promedio diario
  const count_dia = todayOrders?.length ?? 0;
  const ticket_promedio = count_dia > 0 ? Math.round(ingresos_dia / count_dia) : 0;

  // Top 3 ítems más pedidos hoy
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
