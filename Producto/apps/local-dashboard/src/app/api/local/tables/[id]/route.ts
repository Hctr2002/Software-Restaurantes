import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, ensureServiceConfig } from "@/lib/localApi";
import { tableService } from "@/lib/services/tableService";
import { tableSchema } from "@/lib/schemas/tableSchema";
import { ZodError } from "zod";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId } = auth;
  const { id } = await params;

  try {
    const body = await req.json();
    const validatedData = tableSchema.parse(body);

    const { data, error } = await tableService.update(restaurantId, id, validatedData);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId } = auth;
  const { id } = await params;

  const { error } = await tableService.delete(restaurantId, id);

  if (error) {
    const isConflict = error.message.includes("orden");
    return NextResponse.json({ error: error.message }, { status: isConflict ? 409 : 500 });
  }
  return NextResponse.json({ success: true });
}
