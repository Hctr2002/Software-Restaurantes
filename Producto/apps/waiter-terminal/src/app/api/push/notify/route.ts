import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

const VAPID_PUBLIC  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL   = process.env.VAPID_EMAIL ?? 'mailto:admin@menubites.app';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/push/notify — envía Web Push a todos los garzones del restaurante
export async function POST(req: NextRequest) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return NextResponse.json({ error: 'VAPID keys no configuradas' }, { status: 503 });
  }

  const { restaurantId, tableNumber } = await req.json();
  if (!restaurantId) return NextResponse.json({ error: 'restaurantId requerido' }, { status: 400 });

  const db = serviceClient();
  const { data: subs } = await db
    .from('push_subscriptions')
    .select('subscription')
    .eq('restaurant_id', restaurantId);

  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0 });

  const payload = JSON.stringify({
    title: '🍽️ Pedido Listo',
    body:  tableNumber ? `Mesa ${tableNumber} — el pedido está listo para servir.` : 'Un pedido está listo para servir.',
    tag:   'order-ready',
  });

  let sent = 0;
  const stale: string[] = [];

  await Promise.allSettled(
    subs.map(async ({ subscription }) => {
      try {
        await webpush.sendNotification(subscription as any, payload);
        sent++;
      } catch (err: any) {
        // 410 Gone = suscripción expirada
        if (err.statusCode === 410 || err.statusCode === 404) {
          stale.push((subscription as any).endpoint);
        }
      }
    })
  );

  // Limpia suscripciones expiradas
  if (stale.length > 0) {
    await db.from('push_subscriptions')
      .delete()
      .eq('restaurant_id', restaurantId)
      .in('subscription->>endpoint', stale);
  }

  return NextResponse.json({ sent });
}
