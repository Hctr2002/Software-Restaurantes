import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createSessionClient, ensureServiceConfig } from "@/lib/localApi";

export async function PUT(req: NextRequest) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;

  const body = await req.json();
  const { name, password } = body;

  if (!name && !password) {
    return NextResponse.json({ error: "No hay datos para actualizar" }, { status: 400 });
  }

  const sessionClient = createSessionClient(req);
  const updates: { data?: { display_name?: string }; password?: string } = {};

  if (name) updates.data = { display_name: name };
  if (password) updates.password = password;

  const { error } = await sessionClient.auth.updateUser(updates);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
