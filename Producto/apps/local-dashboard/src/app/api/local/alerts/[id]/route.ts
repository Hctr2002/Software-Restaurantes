/**
 * /api/local/alerts/[id] — Resuelve una alerta específica.
 * PUT: Marca la alerta como RESOLVED. Si action="disable_item", también desactiva el ítem de menú asociado.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createServiceClient, ensureServiceConfig } from "@/lib/localApi";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId, user } = auth;
  const { id } = await params;

  const body = await req.json();
  const { action, menuItemId } = body; // action: 'resolve' | 'disable_item'

  const db = createServiceClient();

  if (action === "disable_item" && menuItemId) {
    const { error: itemError } = await db
      .from("menu_items")
      .update({ is_active: false })
      .eq("id", menuItemId)
      .eq("restaurant_id", restaurantId);
    if (itemError) return NextResponse.json({ error: itemError.message }, { status: 500 });
  }

  const { data, error } = await db
    .from("alerts")
    .update({
      status: "RESOLVED",
      resolved_at: new Date().toISOString(),
      resolved_by_email: user.email,
    })
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
