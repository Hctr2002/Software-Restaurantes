import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createServiceClient, createSessionClient, ensureServiceConfig } from "@/lib/localApi";

const ALLOWED_ROLES = ["ADMIN", "GARZON", "COCINA", "CAJERO"];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId } = auth;
  const { id } = await params;

  const body = await req.json();
  const { email, password, role } = body;

  if (role && !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const db = createServiceClient();

  // Verificar que el usuario pertenece al mismo restaurante
  const { data: existing } = await db
    .from("users")
    .select("restaurant_id")
    .eq("id", id)
    .single();

  if (!existing || existing.restaurant_id !== restaurantId) {
    return NextResponse.json({ error: "Usuario no encontrado en esta organización" }, { status: 404 });
  }

  const updates: Record<string, any> = {};
  if (email) updates.email = email.trim().toLowerCase();
  if (password) updates.password = password;
  if (role) updates.app_metadata = { role, restaurant_id: restaurantId };

  const { data, error } = await db.auth.admin.updateUserById(id, updates);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId, user: adminUser } = auth;
  const { id } = await params;

  // Bloquear auto-eliminación
  if (id === adminUser.id) {
    return NextResponse.json({ error: "No puedes eliminar tu propio usuario" }, { status: 400 });
  }

  const db = createServiceClient();

  // Verificar que el usuario pertenece al mismo restaurante
  const { data: existing } = await db
    .from("users")
    .select("restaurant_id")
    .eq("id", id)
    .single();

  if (!existing || existing.restaurant_id !== restaurantId) {
    return NextResponse.json({ error: "Usuario no encontrado en esta organización" }, { status: 404 });
  }

  const { error } = await db.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
