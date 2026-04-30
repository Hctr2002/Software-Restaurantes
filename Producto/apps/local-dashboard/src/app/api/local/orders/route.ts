import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createServiceClient, ensureServiceConfig } from "@/lib/localApi";

export async function GET(req: NextRequest) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId } = auth;

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const statusParam = searchParams.get("status");

  const db = createServiceClient();
  let query = db
    .from("orders")
    .select(
      "id, status, createdAt, table_id:tableId, tables(number), order_items(id, menu_item_id:menuItemId, unit_price:unitPrice, quantity, menu_items(name))"
    )
    .eq("restaurant_id", restaurantId)
    .order("createdAt", { ascending: false })
    .limit(50);

  if (fromParam) query = query.gte("createdAt", fromParam);
  if (statusParam && statusParam !== "ALL") query = query.eq("status", statusParam);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
