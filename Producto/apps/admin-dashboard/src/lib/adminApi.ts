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
        setAll() {
          // Route handlers in this module are API-only; no cookie writes needed.
        },
      },
      cookieOptions: { name: 'sb-default-session' },
    }
  );
}

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function requireSuperAdmin(req: NextRequest) {
  let user;
  const authHeader = req.headers.get("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data.user) {
      return { errorResponse: NextResponse.json({ error: "No autenticado (Token)" }, { status: 401 }) };
    }
    user = data.user;
  } else {
    const sessionClient = createSessionClient(req);
    const {
      data: { user: sessionUser },
      error,
    } = await sessionClient.auth.getUser();

    if (error || !sessionUser) {
      return { errorResponse: NextResponse.json({ error: "No autenticado (Cookie)" }, { status: 401 }) };
    }
    user = sessionUser;
  }

  const role = String(user.app_metadata?.role || "").toUpperCase();
  const restaurantId = user.app_metadata?.restaurant_id;

  if (role !== "SUPER_ADMIN" && !(role === "ADMIN" && !restaurantId)) {
    return { errorResponse: NextResponse.json({ error: "Sin permisos" }, { status: 403 }) };
  }

  return { user };
}

export function ensureServiceConfig() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    );
  }

  return null;
}
