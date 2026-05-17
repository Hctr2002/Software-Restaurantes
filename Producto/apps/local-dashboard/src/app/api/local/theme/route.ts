/**
 * /api/local/theme — Gestión completa de temas visuales del restaurante.
 * GET: Lista todos los temas del restaurante.
 * POST: Crea un nuevo tema validado con themeSchema.
 * PATCH: Activa un tema (action="activate") o actualiza sus campos (action="update").
 * DELETE: Elimina uno o varios temas por ID (parámetros themeId o themeIds CSV).
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, ensureServiceConfig } from "@/lib/localApi";
import { themeService } from "@/lib/services/themeService";
import { themeSchema } from "@/lib/schemas/themeSchema";
import { ZodError } from "zod";

export async function GET(req: NextRequest) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId } = auth;

  const { data, error } = await themeService.getByRestaurant(restaurantId);

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
    const validatedData = themeSchema.parse(body);
    
    const { data, error } = await themeService.save(restaurantId, validatedData);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId } = auth;

  const body = await req.json();
  const { themeId, action } = body;

  if (action === "activate" && themeId) {
    const { data, error } = await themeService.activate(restaurantId, themeId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  if (action === "update" && themeId) {
    const { data, error } = await themeService.update(restaurantId, themeId, body);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId } = auth;

  const { searchParams } = new URL(req.url);
  const themeId = searchParams.get("themeId");
  const themeIds = searchParams.get("themeIds");

  if (themeIds) {
    const ids = themeIds.split(",").map((id) => id.trim()).filter(Boolean);
    if (ids.length === 0) return NextResponse.json({ error: "Falta themeIds" }, { status: 400 });
    const { error } = await themeService.deleteMany(restaurantId, ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, deleted: ids.length });
  }

  if (!themeId) return NextResponse.json({ error: "Falta themeId o themeIds" }, { status: 400 });

  const { error } = await themeService.delete(restaurantId, themeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
