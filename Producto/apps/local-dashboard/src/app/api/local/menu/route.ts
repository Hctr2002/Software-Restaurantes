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
    .from("menu_items")
    .select("id, name, description, price, categoryId:category_id, is_active, restaurant_id, categories(name)")
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
  const { name, description, price, is_active } = body;

  if (!name || price === undefined) {
    return NextResponse.json({ error: "Faltan campos requeridos: name, price" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("menu_items")
    .insert({ name, description: description ?? null, price, is_active: is_active ?? true, restaurant_id: restaurantId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
