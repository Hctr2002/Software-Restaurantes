import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, ensureServiceConfig } from "@/lib/localApi";
import { tableService } from "@/lib/services/tableService";
import { tableSchema } from "@/lib/schemas/tableSchema";
import { ZodError } from "zod";

export async function GET(req: NextRequest) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId } = auth;

  const { data, error } = await tableService.getByRestaurant(restaurantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId } = auth;

  try {
    const body = await req.json();
    const validatedData = tableSchema.parse(body);
    
    const { data, error } = await tableService.create(restaurantId, validatedData);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }

}

