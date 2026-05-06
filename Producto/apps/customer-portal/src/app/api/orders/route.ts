import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// Cliente admin con Service Role Key — corre SOLO en el servidor, nunca expuesto al browser
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderPayload = await req.json();
    const { restaurant_id, table_id, total_amount, items } = body;

    if (!restaurant_id || !items?.length) {
      return NextResponse.json(
        { error: 'restaurant_id e items son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar restaurante activo
    const { data: restaurant, error: restError } = await supabaseAdmin
      .from('restaurants')
      .select('id')
      .eq('id', restaurant_id)
      .eq('status', 'ACTIVE')
      .single();

    if (restError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurante no encontrado o inactivo' },
        { status: 404 }
      );
    }

    // Generar UUID explícitamente — Prisma no pone DEFAULT en la columna id de la BD
    const orderId = randomUUID();

    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        id:           orderId,
        restaurant_id,
        table_id:     table_id || null,
        status:       'PENDING',
        total_amount,
        notes:        'Pedido desde portal web',
      });

    if (orderError) {
      console.error('[api/orders] Error creando order:', orderError.message);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // Crear los order_items con UUIDs explícitos
    const orderItems = items.map((item) => ({
      id:            randomUUID(),
      order_id:      orderId,
      menu_item_id:  item.menu_item_id,
      restaurant_id,
      quantity:      item.quantity,
      unit_price:    item.unit_price,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('[api/orders] Error creando order_items:', itemsError.message);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Marcar mesa como OCCUPIED al recibir el primer pedido
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
