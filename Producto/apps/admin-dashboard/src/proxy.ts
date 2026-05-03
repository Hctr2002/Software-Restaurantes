import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROLE_URLS: Record<string, string | undefined> = {
  ADMIN:   process.env.NEXT_PUBLIC_LOCAL_DASHBOARD_URL,
  COCINA:  process.env.NEXT_PUBLIC_KITCHEN_URL,
  GARZON:  process.env.NEXT_PUBLIC_WAITER_URL,
  CAJERO:  process.env.NEXT_PUBLIC_CASHIER_URL,
};

/**
 * Proxy middleware for authentication and role-based redirection.
 */
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
      // IMPORTANT: Synchronize cookie name with @menu-bites/auth
      cookieOptions: { name: 'sb-default-session' },
    }
  );

  // Using getUser() instead of getSession() for better security as per Supabase recommendations.
  // This will also attempt to refresh the token if necessary.
  const { data: { user }, error } = await supabase.auth.getUser();
  const session = !!user;

  const pathname = req.nextUrl.pathname;
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  const appRole  = user?.app_metadata?.role;
  const userRole = user?.user_metadata?.role;
  const rawRole  = appRole || userRole;
  const role     = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  
  const restaurantId = user?.app_metadata?.restaurant_id;
  const roleUpper = String(role || '').toUpperCase();
  const hasRestaurant = restaurantId && String(restaurantId).trim() !== "" && String(restaurantId) !== "null" && String(restaurantId) !== "undefined";
  const isSuperAdmin = roleUpper === 'SUPER_ADMIN' || (roleUpper === 'ADMIN' && !hasRestaurant);

  console.log(`[Proxy] Path: ${pathname} | Role: ${roleUpper} | IsSuperAdmin: ${isSuperAdmin} | Session: ${session} | Error: ${error?.message || 'none'}`);

  // The login page (/) is always accessible.
  // If session exists and user is at /, we can let them through or redirect to dashboard.
  // For now, follow existing logic.
  if (pathname === '/') return response;

  // No session for a protected route -> redirect to login (/).
  if (!session && !isPublicRoute) {
    console.log(`[Proxy] No valid session for protected route ${pathname}. Redirecting to /`);
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Session exists but user is not a SuperAdmin -> redirect to their specific dashboard.
  if (session && !isPublicRoute && !isSuperAdmin) {
    const target = ROLE_URLS[roleUpper ?? ''];
    console.log(`[Proxy] Not SuperAdmin. Role: ${roleUpper}. Redirecting to operative dashboard: ${target}`);
    if (target) return NextResponse.redirect(new URL(target));
    
    // Fallback if no target is defined for the role.
    console.log(`[Proxy] No target defined for role ${roleUpper}. Redirecting to login.`);
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // All other cases (SuperAdmin or public routes) proceed normally.
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
