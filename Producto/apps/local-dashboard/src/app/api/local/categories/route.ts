/**
 * /api/local/categories — CRUD de categorías del menú.
 * GET: Lista todas las categorías del restaurante ordenadas por nombre.
 * POST: Crea una nueva categoría con nombre, estado activo y estación destino.
 */
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
    .from("categories")
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
  const { name, is_active, target_station } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("categories")
    .insert({ name: name.trim(), is_active: is_active ?? true, restaurant_id: restaurantId, target_station: target_station ?? "KITCHEN" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
