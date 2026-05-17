/**
 * route.ts (api/sessions) — Gestiona la fusión y separación de mesas mediante session_id compartido.
 * POST: une varias mesas bajo un mismo session_id, reasignando órdenes al grupo ganador.
 * DELETE: desvincula las mesas de una sesión y restaura su estado individual.
 */
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

/**
 * Crea un cliente Supabase con service role para actualizaciones multi-fila
 * en tables y orders sin restricciones RLS.
 */
function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Extrae el restaurant_id del JWT del garzón autenticado mediante la cookie sb-waiter-session.
 * Retorna null si no hay sesión activa.
 */
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

  // 1. Obtener las mesas con sus sesiones actuales
  const { data: tables, error: tablesError } = await db
    .from('tables')
    .select('id, status, current_session_id')
    .in('id', tableIds)
    .eq('restaurant_id', restaurantId);

  if (tablesError) return NextResponse.json({ error: tablesError.message }, { status: 500 });

  // 2. Recolectar sesiones únicas entre las mesas a fusionar
  const uniqueSessions: string[] = [
    ...new Set(
      (tables ?? []).map((t) => t.current_session_id).filter(Boolean) as string[]
    ),
  ];

  // VALIDACIÓN DE REDUNDANCIA: Si todas las mesas seleccionadas comparten la misma sesión.
  if (uniqueSessions.length === 1 && (tables ?? []).every(t => t.current_session_id === uniqueSessions[0])) {
    return NextResponse.json({ ok: true, alreadyMerged: true });
  }

  let winningSessionId: string;

  if (uniqueSessions.length === 0) {
    // Ninguna mesa tiene sesión activa: crear una nueva
    winningSessionId = randomUUID();

  } else if (uniqueSessions.length === 1) {
    // Una sola sesión activa: usarla directamente, sin conflicto
    winningSessionId = uniqueSessions[0];

  } else {
    // Conflicto: varias mesas con sesiones distintas.
    // Criterio: la sesión con la orden activa más antigua es la ganadora.
    // Esto respeta la prioridad del grupo que llegó primero al restaurante.
    const { data: oldestOrders, error: oldestError } = await db
      .from('orders')
      .select('session_id, createdAt')
      .in('session_id', uniqueSessions)
      .eq('restaurant_id', restaurantId)
      .not('status', 'in', '("REJECTED","COMPLETED")')
      .order('createdAt', { ascending: true })
      .limit(1);

    if (oldestError) return NextResponse.json({ error: oldestError.message }, { status: 500 });

    // Si no hay órdenes registradas en ninguna sesión, se toma la primera
    winningSessionId = oldestOrders?.[0]?.session_id ?? uniqueSessions[0];

    // Reasignar todas las órdenes de las sesiones descartadas a la ganadora.
    // Se incluyen órdenes DELIVERED para evitar registros huérfanos bajo
    // sesiones que ya no tienen ninguna mesa asociada.
    const losingSessionIds = uniqueSessions.filter((s) => s !== winningSessionId);
    const { error: reassignError } = await db
      .from('orders')
      .update({ session_id: winningSessionId })
      .in('session_id', losingSessionIds)
      .eq('restaurant_id', restaurantId)
      .not('status', 'in', '("REJECTED","COMPLETED")');

    if (reassignError) return NextResponse.json({ error: reassignError.message }, { status: 500 });
  }

  // 3. Todas las mesas pasan a OCCUPIED con el session_id ganador
  const { error: updateTablesError } = await db
    .from('tables')
    .update({ status: 'OCCUPIED', current_session_id: winningSessionId })
    .in('id', tableIds)
    .eq('restaurant_id', restaurantId);

  if (updateTablesError) return NextResponse.json({ error: updateTablesError.message }, { status: 500 });

  // 4. Sincronizar las órdenes activas de todas las mesas con el session_id ganador.
  // Cubre el caso de mesas que estaban FREE y no tenían session_id en sus órdenes.
  const { data: ordersUpdated, error: ordersError } = await db
    .from('orders')
    .update({ session_id: winningSessionId })
    .in('table_id', tableIds)
    .eq('restaurant_id', restaurantId)
    .not('status', 'in', '("REJECTED","COMPLETED")')
    .select('id');

  if (ordersError) return NextResponse.json({ error: ordersError.message }, { status: 500 });

  return NextResponse.json({ sessionId: winningSessionId, ordersUpdated: ordersUpdated?.length ?? 0 });
}

// DELETE /api/sessions — separar mesas (limpiar session_id)
export async function DELETE(req: NextRequest) {
  const restaurantId = await getRestaurantId();
  if (!restaurantId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { sessionId } = await req.json();
  if (!sessionId) return NextResponse.json({ error: 'sessionId requerido' }, { status: 400 });

  const db = serviceClient();
  // 1. Obtener las mesas de esta sesión
  const { data: tables, error: tablesQueryError } = await db
    .from('tables')
    .select('id')
    .eq('current_session_id', sessionId)
    .eq('restaurant_id', restaurantId);

  if (tablesQueryError) return NextResponse.json({ error: tablesQueryError.message }, { status: 500 });

  // 2. Limpiar session_id en los pedidos activos
  const { error } = await db
    .from('orders')
    .update({ session_id: null })
    .eq('session_id', sessionId)
    .eq('restaurant_id', restaurantId)
    .not('status', 'in', '("DELIVERED","REJECTED","COMPLETED")');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 3. Restaurar estado de cada mesa individualmente
  const tableIds = (tables || []).map(t => t.id);
  
  if (tableIds.length > 0) {
    const { data: activeOrders, error: activeOrdersError } = await db
      .from('orders')
      .select('table_id')
      .in('table_id', tableIds)
      .eq('restaurant_id', restaurantId)
      .not('status', 'in', '("COMPLETED","REJECTED")');

    if (activeOrdersError) return NextResponse.json({ error: activeOrdersError.message }, { status: 500 });

    const tablesWithOrders = new Set(activeOrders?.map(o => o.table_id));

    const freeTableIds = tableIds.filter(id => !tablesWithOrders.has(id));
    const occupiedTableIds = tableIds.filter(id => tablesWithOrders.has(id));

    if (freeTableIds.length > 0) {
      await db.from('tables')
        .update({ current_session_id: null, status: 'FREE' })
        .in('id', freeTableIds);
    }
    
    if (occupiedTableIds.length > 0) {
      await db.from('tables')
        .update({ current_session_id: null, status: 'OCCUPIED' })
        .in('id', occupiedTableIds);
    }
  }

  return NextResponse.json({ ok: true });
}
