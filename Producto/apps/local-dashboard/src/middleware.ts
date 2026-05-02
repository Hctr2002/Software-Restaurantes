import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
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
  const authUrl  = process.env.NEXT_PUBLIC_AUTH_URL;

  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  // Extraer slug de /{slug}/dashboard/...
  const slugMatch = pathname.match(/^\/([^/]+)\/dashboard/);
  const urlSlug   = slugMatch?.[1];

  const role         = session?.user?.app_metadata?.role;
  const restaurantId = session?.user?.app_metadata?.restaurant_id;
  const isAdmin      = role === 'ADMIN';

  // Sin sesión y ruta protegida → central login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL(authUrl));
  }

  // Sesión de otro rol en ruta protegida → central login
  if (session && !isPublicRoute && !isAdmin) {
    return NextResponse.redirect(new URL(authUrl));
  }

  // Sesión ADMIN en login → obtener slug y redirigir
  if (session && isAdmin && pathname === '/') {
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
    return NextResponse.redirect(new URL(authUrl));
  }

  // ADMIN en ruta con slug → verificar que el slug coincida con su restaurante
  if (session && isAdmin && urlSlug) {
    const { data } = await supabase
      .from('restaurants')
      .select('slug')
      .eq('id', restaurantId)
      .single();

    if (data?.slug && data.slug !== urlSlug) {
      // Corregir slug en la URL y redirigir
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
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
