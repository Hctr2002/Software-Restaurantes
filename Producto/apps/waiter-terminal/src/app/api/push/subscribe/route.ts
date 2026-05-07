import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getSessionInfo(): Promise<{ userId: string; restaurantId: string } | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
      cookieOptions: { name: 'sb-waiter-session' },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  return {
    userId:       session.user.id,
    restaurantId: session.user.app_metadata?.restaurant_id,
  };
}

// POST /api/push/subscribe — guarda la suscripción VAPID del browser
export async function POST(req: NextRequest) {
  const info = await getSessionInfo();
  if (!info) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const subscription = await req.json();
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 });
  }

  const db = serviceClient();
  const { error } = await db.from('push_subscriptions').upsert({
    user_id:       info.userId,
    restaurant_id: info.restaurantId,
    subscription:  subscription,
    updated_at:    new Date().toISOString(),
  }, { onConflict: 'user_id, restaurant_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/push/subscribe — elimina la suscripción
export async function DELETE() {
  const info = await getSessionInfo();
  if (!info) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const db = serviceClient();
  await db.from('push_subscriptions')
    .delete()
    .eq('user_id', info.userId)
    .eq('restaurant_id', info.restaurantId);

  return NextResponse.json({ ok: true });
}
