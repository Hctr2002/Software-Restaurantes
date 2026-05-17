/**
 * localApi — Utilidades de autenticación y clientes Supabase para rutas API del dashboard local.
 * Provee requireAdmin (guard de sesión y rol), createSessionClient y createServiceClient.
 */
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * Crea un cliente Supabase con las cookies de sesión del request entrante.
 * Usa la cookie `sb-local-session` para aislar sesiones del local-dashboard.
 */
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
      cookieOptions: { name: 'sb-local-session' },
    }
  );
}

/**
 * Crea un cliente Supabase con la service role key, omitiendo RLS.
 * Usar exclusivamente en rutas API del servidor — nunca en el cliente.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Guard de autenticación para rutas API del local-dashboard.
 * Valida que el usuario tenga rol ADMIN y restaurantId en su JWT.
 * Retorna { errorResponse } si falla, o { user, restaurantId } si pasa.
 */
export async function requireAdmin(req: NextRequest) {
  const sessionClient = createSessionClient(req);
  // Using getUser() instead of getSession() for better security and token refresh.
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

/**
 * Verifica que las variables de entorno de Supabase estén configuradas.
 * Retorna una NextResponse de error 500 si faltan, o null si todo está OK.
 */
export function ensureServiceConfig() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Faltan variables de entorno requeridas" },
      { status: 500 }
    );
  }
  return null;
}
