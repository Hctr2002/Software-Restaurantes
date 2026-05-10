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

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function insertOrder(
  db: ReturnType<typeof serviceClient>,
  params: {
    restaurant_id: string;
    table_id: string | null;
    station: 'KITCHEN' | 'BAR';
    total_amount: number;
    parent_order_id?: string;
  }
): Promise<{ id: string; error: string | null }> {
  const id = randomUUID();
  const { error } = await db.from('orders').insert({
    id,
    restaurant_id: params.restaurant_id,
    table_id: params.table_id || null,
    status: 'PENDING',
    total_amount: params.total_amount,
    station: params.station,
    parent_order_id: params.parent_order_id ?? null,
    notes: 'Pedido desde portal web',
  });
  return { id, error: error?.message ?? null };
}

async function insertItems(
  db: ReturnType<typeof serviceClient>,
  orderId: string,
  restaurant_id: string,
  items: OrderItemPayload[]
): Promise<string | null> {
  const rows = items.map((item) => ({
    id: randomUUID(),
    order_id: orderId,
    menu_item_id: item.menu_item_id,
    restaurant_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }));
  const { error } = await db.from('order_items').insert(rows);
  return error?.message ?? null;
}

export async function POST(req: NextRequest) {
  const db = serviceClient();
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
    const { data: restaurant, error: restError } = await db
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

    // Obtener target_station de cada menu_item via su categoría (dos queries explícitas)
    // Filtramos por restaurant_id para evitar que IDs de otros restaurantes sean resueltos
    const menuItemIds = items.map((i) => i.menu_item_id);
    const { data: menuItemRows, error: miError } = await db
      .from('menu_items')
      .select('id, category_id')
      .in('id', menuItemIds)
      .eq('restaurant_id', restaurant_id);

    if (miError) {
      return NextResponse.json({ error: miError.message }, { status: 500 });
    }

    // Validar que todos los items existen y pertenecen al restaurante
    if ((menuItemRows ?? []).length !== menuItemIds.length) {
      const foundIds = new Set((menuItemRows ?? []).map((mi: any) => mi.id));
      const invalid = menuItemIds.filter((id) => !foundIds.has(id));
      return NextResponse.json(
        { error: `Items no válidos o de otro restaurante: ${invalid.join(', ')}` },
        { status: 400 }
      );
    }

    const categoryIds = [...new Set((menuItemRows ?? []).map((mi: any) => mi.category_id).filter(Boolean))];
    const { data: categoryRows } = await db
      .from('categories')
      .select('id, target_station')
      .in('id', categoryIds)
      .eq('restaurant_id', restaurant_id);

    const categoryStationMap = new Map<string, 'KITCHEN' | 'BAR'>(
      (categoryRows ?? []).map((c: any) => [c.id, c.target_station as 'KITCHEN' | 'BAR'])
    );

    const stationMap = new Map<string, 'KITCHEN' | 'BAR'>(
      (menuItemRows ?? []).map((mi: any) => [
        mi.id,
        categoryStationMap.get(mi.category_id) ?? 'KITCHEN',
      ])
    );

    const kitchenItems = items.filter((i) => stationMap.get(i.menu_item_id) === 'KITCHEN');
    const barItems     = items.filter((i) => stationMap.get(i.menu_item_id) === 'BAR');

    const kitchenTotal = kitchenItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const barTotal     = barItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);

    const orderIds: string[] = [];

    // Crear sub-pedido KITCHEN
    if (kitchenItems.length > 0) {
      const { id: kitchenOrderId, error: koError } = await insertOrder(db, {
        restaurant_id,
        table_id,
        station: 'KITCHEN',
        total_amount: kitchenItems.length === items.length ? total_amount : kitchenTotal,
      });
      if (koError) {
        return NextResponse.json({ error: koError }, { status: 500 });
      }
      const itemsError = await insertItems(db, kitchenOrderId, restaurant_id, kitchenItems);
      if (itemsError) {
        return NextResponse.json({ error: itemsError }, { status: 500 });
      }
      orderIds.push(kitchenOrderId);
    }

    // Crear sub-pedido BAR (referencia al pedido KITCHEN como parent si existe)
    if (barItems.length > 0) {
      const { id: barOrderId, error: boError } = await insertOrder(db, {
        restaurant_id,
        table_id,
        station: 'BAR',
        total_amount: barItems.length === items.length ? total_amount : barTotal,
        parent_order_id: orderIds[0],
      });
      if (boError) {
        return NextResponse.json({ error: boError }, { status: 500 });
      }
      const itemsError = await insertItems(db, barOrderId, restaurant_id, barItems);
      if (itemsError) {
        return NextResponse.json({ error: itemsError }, { status: 500 });
      }
      orderIds.push(barOrderId);
    }

    // Marcar mesa como OCCUPIED
    if (table_id) {
      await db.from('tables').update({ status: 'OCCUPIED' }).eq('id', table_id);
    }

    return NextResponse.json({ id: orderIds[0], orderIds }, { status: 201 });
  } catch (err: any) {
    console.error('[api/orders] Error inesperado:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
