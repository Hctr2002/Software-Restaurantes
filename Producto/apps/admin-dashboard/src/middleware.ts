import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROLE_URLS: Record<string, string | undefined> = {
  ADMIN:   process.env.NEXT_PUBLIC_LOCAL_DASHBOARD_URL,
  COCINA:  process.env.NEXT_PUBLIC_KITCHEN_URL,
  GARZON:  process.env.NEXT_PUBLIC_WAITER_URL,
  CAJERO:  process.env.NEXT_PUBLIC_CASHIER_URL,
};

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: req.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  const role = session?.user?.app_metadata?.role;
  const isSuperAdmin = role === 'SUPER_ADMIN';

  // Sin sesión y ruta protegida → login (se queda en puerto 3000)
  if (!session && !isPublicRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Sesión de otro rol en ruta protegida → redirigir a su app correspondiente
  if (session && !isPublicRoute && !isSuperAdmin) {
    const target = ROLE_URLS[role ?? ''];
    if (target) return NextResponse.redirect(new URL(target));
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Sesión SUPER_ADMIN en login → dashboard
  if (session && isSuperAdmin && pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Sesión de otro rol en login → redirigir a su app
  if (session && !isSuperAdmin && pathname === '/') {
    const target = ROLE_URLS[role ?? ''];
    if (target) return NextResponse.redirect(new URL(target));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
