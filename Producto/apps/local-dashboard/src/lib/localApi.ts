import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export function createSessionClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    }
  );
}

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function requireAdmin(req: NextRequest) {
  const sessionClient = createSessionClient(req);
  const { data: { user }, error } = await sessionClient.auth.getUser();

  if (error || !user) {
    return { errorResponse: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }

  if (user.app_metadata?.role !== "ADMIN") {
    return { errorResponse: NextResponse.json({ error: "Sin permisos" }, { status: 403 }) };
  }

  const restaurantId = user.app_metadata?.restaurant_id as string | undefined;
  if (!restaurantId) {
    return { errorResponse: NextResponse.json({ error: "Sin restaurante asignado" }, { status: 403 }) };
  }

  return { user, restaurantId };
}

export function ensureServiceConfig() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Faltan variables de entorno requeridas" },
      { status: 500 }
    );
  }
  return null;
}
