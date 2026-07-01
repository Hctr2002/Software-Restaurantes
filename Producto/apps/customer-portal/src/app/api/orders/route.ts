/**
 * API Route: /api/orders
 * Maneja la creación y consulta de pedidos desde el portal del cliente.
 * Usa la Service Role Key para bypasear RLS — el cliente anónimo no puede insertar directamente.
 * Los pedidos se dividen automáticamente en sub-órdenes por estación (KITCHEN / BAR)
 * según el target_station de la categoría de cada ítem.
 */

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

/**
 * GET /api/orders?table_id=<uuid>
 * Retorna todos los pedidos activos de una mesa (excluye REJECTED y COMPLETED).
 * Incluye los ítems y nombres de productos en la respuesta.
 */
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

/** Crea un cliente Supabase con permisos de administrador (Service Role) sin persistir sesión. */
function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * POST /api/orders
 * Recibe el carrito del cliente, valida que los ítems pertenezcan al restaurante,
 * y crea sub-pedidos separados por estación (KITCHEN y/o BAR).
 * Marca la mesa como OCCUPIED al finalizar.
 */
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

    const menuItemIds = items.map((i) => i.menu_item_id);

    // ── Lecturas en PARALELO (1 sola ida a la BD) ────────────────────────────
    // Independientes entre sí: restaurante activo, menu_items del pedido,
    // categorías del restaurante (para resolver estación) y sesión de la mesa.
    const [restaurantRes, menuItemsRes, categoriesRes, tableRes] = await Promise.all([
      db.from('restaurants').select('id').eq('id', restaurant_id).eq('status', 'ACTIVE').single(),
      db.from('menu_items').select('id, category_id').in('id', menuItemIds).eq('restaurant_id', restaurant_id),
      db.from('categories').select('id, target_station').eq('restaurant_id', restaurant_id),
      table_id
        ? db.from('tables').select('current_session_id').eq('id', table_id).single()
        : Promise.resolve({ data: null, error: null } as any),
    ]);

    if (restaurantRes.error || !restaurantRes.data) {
      return NextResponse.json({ error: 'Restaurante no encontrado o inactivo' }, { status: 404 });
    }
    if (menuItemsRes.error) {
      return NextResponse.json({ error: menuItemsRes.error.message }, { status: 500 });
    }

    const menuItemRows = menuItemsRes.data ?? [];
    // Validar que todos los items existen y pertenecen al restaurante
    if (menuItemRows.length !== menuItemIds.length) {
      const foundIds = new Set(menuItemRows.map((mi: any) => mi.id));
      const invalid = menuItemIds.filter((id) => !foundIds.has(id));
      return NextResponse.json(
        { error: `Items no válidos o de otro restaurante: ${invalid.join(', ')}` },
        { status: 400 }
      );
    }

    // session_id de la mesa: agrupa el cobro en mesas fusionadas.
    const session_id = (tableRes.data as any)?.current_session_id ?? null;

    // Resolver la estación (KITCHEN/BAR) de cada ítem por su categoría (default KITCHEN).
    const categoryStationMap = new Map<string, 'KITCHEN' | 'BAR'>(
      (categoriesRes.data ?? []).map((c: any) => [c.id, c.target_station as 'KITCHEN' | 'BAR'])
    );
    const stationMap = new Map<string, 'KITCHEN' | 'BAR'>(
      menuItemRows.map((mi: any) => [mi.id, categoryStationMap.get(mi.category_id) ?? 'KITCHEN'])
    );

    const kitchenItems = items.filter((i) => stationMap.get(i.menu_item_id) === 'KITCHEN');
    const barItems     = items.filter((i) => stationMap.get(i.menu_item_id) === 'BAR');
    const kitchenTotal = kitchenItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const barTotal     = barItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);

    // ── Construir sub-órdenes con UUID local para insertarlas en una sola query ─
    const kitchenOrderId = kitchenItems.length > 0 ? randomUUID() : null;
    const barOrderId     = barItems.length > 0 ? randomUUID() : null;
    const baseOrder = {
      restaurant_id,
      table_id: table_id || null,
      session_id,
      status: 'PENDING' as const,
      notes: 'Pedido desde portal web',
    };
    const orderRows: any[] = [];
    if (kitchenOrderId) {
      orderRows.push({
        ...baseOrder, id: kitchenOrderId, station: 'KITCHEN',
        total_amount: kitchenItems.length === items.length ? total_amount : kitchenTotal,
        parent_order_id: null,
      });
    }
    if (barOrderId) {
      orderRows.push({
        ...baseOrder, id: barOrderId, station: 'BAR',
        total_amount: barItems.length === items.length ? total_amount : barTotal,
        parent_order_id: kitchenOrderId, // referencia al pedido de cocina si existe
      });
    }

    // Ítems de todas las sub-órdenes
    const itemRows = [
      ...kitchenItems.map((it) => ({ id: randomUUID(), order_id: kitchenOrderId, menu_item_id: it.menu_item_id, restaurant_id, quantity: it.quantity, unit_price: it.unit_price })),
      ...barItems.map((it) => ({ id: randomUUID(), order_id: barOrderId, menu_item_id: it.menu_item_id, restaurant_id, quantity: it.quantity, unit_price: it.unit_price })),
    ];

    // ── Escritura ATÓMICA en 1 ida (RPC transaccional) ───────────────────────
    // Inserta órdenes + ítems y marca la mesa OCCUPIED todo-o-nada; si algo falla,
    // se revierte completo (sin órdenes ni ítems huérfanos).
    const { error: txError } = await db.rpc('create_order_tx', {
      p_orders: orderRows,
      p_items: itemRows,
      p_table_id: table_id || null,
    });
    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    const orderIds = [kitchenOrderId, barOrderId].filter(Boolean) as string[];
    return NextResponse.json({ id: orderIds[0], orderIds }, { status: 201 });
  } catch (err: any) {
    console.error('[api/orders] Error inesperado:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
