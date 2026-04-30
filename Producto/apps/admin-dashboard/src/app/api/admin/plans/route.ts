import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, ensureServiceConfig, requireSuperAdmin } from "@/lib/adminApi";

export async function GET(req: NextRequest) {
  const configError = ensureServiceConfig();
  if (configError) return configError;

  const auth = await requireSuperAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .order("createdAt", { ascending: true });

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
  const { name, price, description, features, popular, period } = body;

  if (!name || !price) {
    return NextResponse.json({ error: "Nombre y precio son obligatorios" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("plans")
    .insert([{ 
      name, 
      price, 
      description, 
      features, 
      popular: !!popular,
      period: period || "/mes"
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
