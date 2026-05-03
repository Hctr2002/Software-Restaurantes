import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createServiceClient, ensureServiceConfig } from "@/lib/localApi";

export async function GET(req: NextRequest) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId } = auth;

  const db = createServiceClient();
  const { data, error } = await db
    .from("inventories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId } = auth;

  const body = await req.json();
  const { name, stock, unit } = body;

  if (!name?.trim() || stock === undefined || !unit?.trim()) {
    return NextResponse.json({ error: "Faltan campos requeridos: name, stock, unit" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("inventories")
    .insert({ name: name.trim(), stock: Number(stock), unit: unit.trim(), restaurant_id: restaurantId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
