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
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: req.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
      cookieOptions: { name: 'sb-kds-session' },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000';
  const rawRole = session?.user?.app_metadata?.role;
  const role = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  const isKitchen = String(role).toUpperCase() === 'COCINA';

  // Sin sesión → central login
  if (!session) {
    return NextResponse.redirect(new URL(authUrl, req.url));
  }

  // Rol incorrecto → central login
  if (!isKitchen) {
    return NextResponse.redirect(new URL(authUrl, req.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
