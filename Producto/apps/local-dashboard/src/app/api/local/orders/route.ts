import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createServiceClient, ensureServiceConfig } from "@/lib/localApi";

export async function GET(req: NextRequest) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId } = auth;

  const { searchParams } = new URL(req.url);
  const fromParam   = searchParams.get("from");
  const toParam     = searchParams.get("to");
  const statusParam = searchParams.get("status");
  const limitParam  = searchParams.get("limit");
  const limit       = Math.min(parseInt(limitParam ?? "50", 10) || 50, 2000);

  const db = createServiceClient();
  let query = db
    .from("orders")
    .select(
      "id, status, createdAt, tableId:table_id, userId:user_id, tables(number), users(email), order_items(id, menuItemId:menu_item_id, unitPrice:unit_price, quantity, menu_items(name))"
    )
    .eq("restaurant_id", restaurantId)
    .order("createdAt", { ascending: false })
    .limit(limit);

  if (fromParam) query = query.gte("createdAt", fromParam);
  if (toParam)   query = query.lte("createdAt", toParam);
  if (statusParam && statusParam !== "ALL") query = query.eq("status", statusParam);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
