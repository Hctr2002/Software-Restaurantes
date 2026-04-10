import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, ensureServiceConfig, requireSuperAdmin } from "@/lib/adminApi";

export async function GET(req: NextRequest) {
  const configError = ensureServiceConfig();
  if (configError) return configError;

  const auth = await requireSuperAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, role, restaurant_id, createdAt, restaurants(name)")
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
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const role = String(body.role || "CLIENTE").trim();
  const restaurantId = body.restaurantId ? String(body.restaurantId).trim() : null;

  if (!email || !password) {
    return NextResponse.json({ error: "email y password son obligatorios" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      role,
      restaurant_id: restaurantId,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
