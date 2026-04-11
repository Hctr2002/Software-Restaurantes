import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, ensureServiceConfig, requireSuperAdmin } from "@/lib/adminApi";

export async function GET(req: NextRequest) {
  const configError = ensureServiceConfig();
  if (configError) return configError;

  const auth = await requireSuperAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, status, createdAt")
    .order("createdAt", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const configError = ensureServiceConfig();
  if (configError) return configError;

  const auth = await requireSuperAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;

  const body = await req.json();
  const name = String(body.name || "").trim();
  const slug = String(body.slug || "").trim();
  const status = String(body.status || "ACTIVE").trim();

  if (!name || !slug) {
    return NextResponse.json({ error: "name y slug son obligatorios" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("restaurants")
    .insert([{ id: crypto.randomUUID(), name, slug, status }])
    .select("id, name, slug, status, createdAt")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
