import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getRestaurantId(): Promise<string | null> {
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
  return session?.user?.app_metadata?.restaurant_id ?? null;
}

// POST /api/sessions — fusionar mesas bajo un session_id compartido
export async function POST(req: NextRequest) {
  const restaurantId = await getRestaurantId();
  if (!restaurantId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { tableIds } = await req.json();
  if (!Array.isArray(tableIds) || tableIds.length < 2) {
    return NextResponse.json({ error: 'Se necesitan al menos 2 mesas' }, { status: 400 });
  }

  const sessionId = randomUUID();
  const db = serviceClient();

  // Actualizar todas las órdenes activas de esas mesas con el session_id
  const { data, error } = await db
    .from('orders')
    .update({ session_id: sessionId })
    .in('table_id', tableIds)
    .eq('restaurant_id', restaurantId)
    .not('status', 'in', '("DELIVERED","REJECTED")')
    .select('id');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sessionId, ordersUpdated: data?.length ?? 0 });
}

// DELETE /api/sessions — separar mesas (limpiar session_id)
export async function DELETE(req: NextRequest) {
  const restaurantId = await getRestaurantId();
  if (!restaurantId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { sessionId } = await req.json();
  if (!sessionId) return NextResponse.json({ error: 'sessionId requerido' }, { status: 400 });

  const db = serviceClient();
  const { error } = await db
    .from('orders')
    .update({ session_id: null })
    .eq('session_id', sessionId)
    .eq('restaurant_id', restaurantId)
    .not('status', 'in', '("DELIVERED","REJECTED")');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
