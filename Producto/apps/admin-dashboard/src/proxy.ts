import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROLE_URLS: Record<string, string | undefined> = {
  ADMIN:   process.env.NEXT_PUBLIC_LOCAL_DASHBOARD_URL,
  COCINA:  process.env.NEXT_PUBLIC_KITCHEN_URL,
  GARZON:  process.env.NEXT_PUBLIC_WAITER_URL,
  CAJERO:  process.env.NEXT_PUBLIC_CASHIER_URL,
};

export async function proxy(req: NextRequest) {
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

  // La ruta de login (/) siempre es accesible para permitir múltiples sesiones
  // desde el mismo navegador sin que una sesión previa bloquee el acceso.
  if (pathname === '/') return response;

  // Sin sesión en ruta protegida → login
  if (!session && !isPublicRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Sesión de rol operacional en ruta protegida → su app
  if (session && !isPublicRoute && !isSuperAdmin) {
    const target = ROLE_URLS[role ?? ''];
    if (target) return NextResponse.redirect(new URL(target));
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // SUPER_ADMIN sin sesión activa en /dashboard → dejar pasar normalmente
  if (session && isSuperAdmin) return response;

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
