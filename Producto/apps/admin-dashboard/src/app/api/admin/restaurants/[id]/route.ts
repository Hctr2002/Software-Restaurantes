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
  const updates: Record<string, any> = {};

  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.slug !== undefined) updates.slug = String(body.slug).trim();
  if (body.status !== undefined) updates.status = String(body.status).trim();
  if (body.planId !== undefined) updates.plan_id = body.planId ? String(body.planId).trim() : null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("restaurants")
    .update(updates)
    .eq("id", id)
    .select("id, name, slug, status, plan_id, createdAt, plans(name)")
    .single();

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
  const supabase = createServiceClient();
  const { error } = await supabase.from("restaurants").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
