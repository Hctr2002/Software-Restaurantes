import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, ensureServiceConfig, requireSuperAdmin } from "@/lib/adminApi";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const configError = ensureServiceConfig();
  if (configError) return configError;

  const auth = await requireSuperAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const body = await req.json();
  const email = body.email ? String(body.email).trim().toLowerCase() : undefined;
  const password = body.password ? String(body.password) : undefined;
  const role = body.role ? String(body.role).trim() : undefined;
  const restaurantId = body.restaurantId === "" || body.restaurantId === null || body.restaurantId === undefined
    ? null
    : String(body.restaurantId).trim();

  const updatePayload: {
    email?: string;
    password?: string;
    app_metadata?: {
      role?: string;
      restaurant_id?: string | null;
    };
  } = {};

  if (email) updatePayload.email = email;
  if (password) updatePayload.password = password;
  if (role !== undefined || restaurantId !== undefined) {
    updatePayload.app_metadata = {
      role,
      restaurant_id: restaurantId,
    };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.updateUserById(id, updatePayload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const configError = ensureServiceConfig();
  if (configError) return configError;

  const auth = await requireSuperAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;

  if (auth.user.id === id) {
    return NextResponse.json({ error: "No puedes eliminar tu propio usuario" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.auth.admin.deleteUser(id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
