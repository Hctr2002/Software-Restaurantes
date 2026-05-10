import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

interface OrderItemPayload {
  menu_item_id: string;
  quantity: number;
  unit_price: number;
}

interface CreateOrderPayload {
  restaurant_id: string;
  table_id: string | null;
  total_amount: number;
  items: OrderItemPayload[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tableId = searchParams.get('table_id');

  if (!tableId) {
    return NextResponse.json({ error: 'table_id es requerido' }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        items:order_items(*, menu_item:menu_items(name))
      `)
      .eq('table_id', tableId)
      .not('status', 'in', '("REJECTED","COMPLETED")')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[api/orders] GET error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  try {
    const body: CreateOrderPayload = await req.json();
    const { restaurant_id, table_id, total_amount, items } = body;

    if (!restaurant_id || !items?.length) {
      return NextResponse.json(
        { error: 'restaurant_id e items son obligatorios' },
        { status: 400 }
      );
    }

    // Generar UUID explícitamente
    const orderId = randomUUID();

    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        id: orderId,
        restaurant_id,
        table_id: table_id || null,
        status: 'PENDING',
        total_amount,
        notes: 'Pedido nuevo',
      });

    if (orderError) {
      console.error('[api/orders] Error creando order:', orderError.message);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // Crear los order_items
    const orderItems = items.map((item) => ({
      id: randomUUID(),
      order_id: orderId,
      menu_item_id: item.menu_item_id,
      restaurant_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('[api/orders] Error creando order_items:', itemsError.message);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    if (table_id) {
      await supabaseAdmin
        .from('tables')
        .update({ status: 'OCCUPIED' })
        .eq('id', table_id);
    }

    return NextResponse.json({ id: orderId }, { status: 201 });
  } catch (err: any) {
    console.error('[api/orders] Error inesperado:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
