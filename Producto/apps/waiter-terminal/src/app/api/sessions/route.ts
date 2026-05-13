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

  const db = serviceClient();

  // 1. Obtener las mesas para ver sus estados y sesiones actuales
  const { data: tables, error: tablesError } = await db
    .from('tables')
    .select('id, status, current_session_id')
    .in('id', tableIds)
    .eq('restaurant_id', restaurantId);

  if (tablesError) return NextResponse.json({ error: tablesError.message }, { status: 500 });

  // 2. Determinar el sessionId a usar
  // Buscamos si alguna mesa ya tiene una sesión activa
  const existingSessionTable = tables?.find(t => t.current_session_id);
  const sessionId = existingSessionTable?.current_session_id || randomUUID();

  // 3. Actualizar las mesas
  // Todas pasan a estar OCCUPIED y con el sessionId compartido
  const { error: updateTablesError } = await db
    .from('tables')
    .update({ status: 'OCCUPIED', current_session_id: sessionId })
    .in('id', tableIds)
    .eq('restaurant_id', restaurantId);

  if (updateTablesError) return NextResponse.json({ error: updateTablesError.message }, { status: 500 });

  // 4. Actualizar todas las órdenes activas de esas mesas con el session_id
  const { data: ordersUpdated, error: ordersError } = await db
    .from('orders')
    .update({ session_id: sessionId })
    .in('table_id', tableIds)
    .eq('restaurant_id', restaurantId)
    .not('status', 'in', '("DELIVERED","REJECTED")')
    .select('id');

  if (ordersError) return NextResponse.json({ error: ordersError.message }, { status: 500 });

  return NextResponse.json({ sessionId, ordersUpdated: ordersUpdated?.length ?? 0 });
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
