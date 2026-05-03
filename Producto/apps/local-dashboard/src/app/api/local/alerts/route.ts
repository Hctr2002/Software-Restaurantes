import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createServiceClient, ensureServiceConfig } from "@/lib/localApi";

export async function GET(req: NextRequest) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId } = auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "PENDING";

  const db = createServiceClient();
  const { data, error } = await db
    .from("alerts")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
