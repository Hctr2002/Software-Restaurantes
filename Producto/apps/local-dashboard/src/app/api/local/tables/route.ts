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
    .from("tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("number");

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
  const { number, label, status } = body;

  if (!number) {
    return NextResponse.json({ error: "Falta el campo requerido: number" }, { status: 400 });
  }

  const db = createServiceClient();
  const qrData = `restaurant_${restaurantId}_table_${number}`;
  const { data, error } = await db
    .from("tables")
    .insert({ number, label: label ?? null, status: status ?? "FREE", restaurant_id: restaurantId, qr_data: qrData })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
