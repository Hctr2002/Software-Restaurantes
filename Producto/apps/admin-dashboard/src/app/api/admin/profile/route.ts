import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, ensureServiceConfig, requireSuperAdmin } from "@/lib/adminApi";

export async function PUT(req: NextRequest) {
  const configError = ensureServiceConfig();
  if (configError) return configError;

  const auth = await requireSuperAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;

  const body = await req.json();
  const name = body.name ? String(body.name).trim() : undefined;
  const password = body.password ? String(body.password) : undefined;

  const updatePayload: {
    password?: string;
    user_metadata?: {
      name?: string;
    };
  } = {
    user_metadata: {}
  };

  if (password) updatePayload.password = password;
  if (name !== undefined) updatePayload.user_metadata!.name = name;

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.updateUserById(auth.user.id, updatePayload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
