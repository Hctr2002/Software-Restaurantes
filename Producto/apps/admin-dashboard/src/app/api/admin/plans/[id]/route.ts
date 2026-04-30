import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, ensureServiceConfig, requireSuperAdmin } from "@/lib/adminApi";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const configError = ensureServiceConfig();
  if (configError) return configError;

  const auth = await requireSuperAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const body = await req.json();
  const { name, price, description, features, popular, period } = body;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("plans")
    .update({ 
      name, 
      price, 
      description, 
      features, 
      popular,
      period,
      updatedAt: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const configError = ensureServiceConfig();
  if (configError) return configError;

  const auth = await requireSuperAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("plans")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
