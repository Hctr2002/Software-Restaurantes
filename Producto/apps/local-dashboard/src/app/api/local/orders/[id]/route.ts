import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createServiceClient, ensureServiceConfig } from "@/lib/localApi";

const VALID_STATUSES = ["PENDING", "VALIDATED", "PREPARING", "READY", "DELIVERED", "CANCELLED", "REJECTED"];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId } = auth;
  const { id } = await params;

  const body = await req.json();
  const { status } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("orders")
    .update({ status })
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  return NextResponse.json({ data });
}
