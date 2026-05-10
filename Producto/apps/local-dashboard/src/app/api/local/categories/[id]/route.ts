import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createServiceClient, ensureServiceConfig } from "@/lib/localApi";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId } = auth;
  const { id } = await params;

  const body = await req.json();
  const { name, is_active, target_station } = body;

  const db = createServiceClient();
  const { data, error } = await db
    .from("categories")
    .update({ name: name?.trim(), is_active, ...(target_station && { target_station }) })
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId } = auth;
  const { id } = await params;

  const db = createServiceClient();
  const { error } = await db
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
