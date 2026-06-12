/**
 * proxy.ts — Middleware de autenticación y enrutamiento del local-dashboard.
 * Reemplaza el middleware de Next.js para cubrir también rutas /api/* con refresco de token.
 * Verifica sesión, rol ADMIN y coherencia del slug en la URL antes de continuar.
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  let response = NextResponse.next({ request: { headers: req.headers } });

  if (req.nextUrl.pathname.startsWith('/auth/callback')) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: req.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
      cookieOptions: { name: 'sb-local-session' },
    }
  );

  // Using getUser() instead of getSession() for better security and token refresh.
  const { data: { user }, error } = await supabase.auth.getUser();
  const sessionExists = !!user;

  const pathname = req.nextUrl.pathname;
  const authUrl  = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000';

  // API routes only need token refresh — no redirects
  if (pathname.startsWith('/api')) return response;

  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth/callback');

  // Extraer slug de /{slug}/dashboard/...
  const slugMatch = pathname.match(/^\/([^/]+)\/dashboard/);
  const urlSlug   = slugMatch?.[1];

  const rawRole = user?.app_metadata?.role;
  const role = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  const restaurantId = user?.app_metadata?.restaurant_id;
  const roleUpper = String(role || '').toUpperCase();
  const isAdmin = roleUpper === 'ADMIN';

  const isDev = process.env.NODE_ENV !== 'production';

  // Handle invalid sessions or refresh token errors on protected routes
  if (error && !isPublicRoute) {
    if (isDev) console.warn(`[Proxy] Auth error on ${pathname}: ${error.message}. Redirecting to central auth.`);
    return NextResponse.redirect(new URL(authUrl, req.url));
  }

  // Sin sesión y ruta protegida → central login
  if (!sessionExists && !isPublicRoute) {
    return NextResponse.redirect(new URL(authUrl, req.url));
  }

  // Sesión de otro rol en ruta protegida → central login
  if (sessionExists && !isPublicRoute && !isAdmin) {
    return NextResponse.redirect(new URL(authUrl, req.url));
  }

  // Sesión ADMIN en login → obtener slug y redirigir
  if (sessionExists && isAdmin && pathname === '/') {
    const { data } = await supabase
      .from('restaurants')
      .select('slug')
      .eq('id', restaurantId)
      .single();

    if (data?.slug) {
      const url = req.nextUrl.clone();
      url.pathname = `/${data.slug}/dashboard`;
      return NextResponse.redirect(url);
    }
    // Si no tiene restaurante asignado → central login
    return NextResponse.redirect(new URL(authUrl, req.url));
  }

  // ADMIN en ruta con slug → verificar que el slug coincida con su restaurante
  if (sessionExists && isAdmin && urlSlug) {
    const { data } = await supabase
      .from('restaurants')
      .select('slug')
      .eq('id', restaurantId)
      .single();

    if (data?.slug && data.slug !== urlSlug) {
      const url = req.nextUrl.clone();
      url.pathname = pathname.replace(
        `/${urlSlug}/dashboard`,
        `/${data.slug}/dashboard`
      );
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
