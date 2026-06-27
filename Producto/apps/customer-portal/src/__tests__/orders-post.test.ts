/**
 * Tests de POST /api/orders (customer-portal) — creación de pedidos desde el portal.
 * Cubre la lógica central de split por estación (KITCHEN/BAR), validación de ítems
 * pertenecientes al restaurante, y marcado de mesa como OCCUPIED.
 * El cliente Supabase se enruta por tabla para resolver cada query con datos propios.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockCreateClient = vi.fn()
vi.mock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }))
vi.mock('crypto', () => {
  let n = 0
  return { randomUUID: () => `uuid-${++n}` }
})

const calls: { table: string; method: string; payload: any }[] = []

function chainFor(table: string, resolved: any) {
  const chain: any = {}
  chain.then = (resolve: any) => Promise.resolve(resolved).then(resolve)
  ;['eq', 'in', 'not', 'order', 'select'].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain)
  })
  chain.insert = vi.fn((payload: any) => {
    calls.push({ table, method: 'insert', payload })
    return chain
  })
  chain.update = vi.fn((payload: any) => {
    calls.push({ table, method: 'update', payload })
    return chain
  })
  chain.single = vi.fn().mockResolvedValue(resolved)
  return chain
}

function setupClient(results: Record<string, any>) {
  mockCreateClient.mockReturnValue({
    from: vi.fn((t: string) => chainFor(t, results[t] ?? { data: null, error: null })),
  })
}

const makePost = (body: object) =>
  new NextRequest('http://localhost/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const ACTIVE_RESTAURANT = { data: { id: 'r1' }, error: null }
const kitchenItem = { menu_item_id: 'mi-k', quantity: 1, unit_price: 1000 }
const barItem = { menu_item_id: 'mi-b', quantity: 2, unit_price: 500 }

/** Resultados por tabla para un pedido válido con un ítem de cocina y uno de barra. */
function fullResults() {
  return {
    restaurants: ACTIVE_RESTAURANT,
    menu_items: {
      data: [
        { id: 'mi-k', category_id: 'cat-k' },
        { id: 'mi-b', category_id: 'cat-b' },
      ],
      error: null,
    },
    categories: {
      data: [
        { id: 'cat-k', target_station: 'KITCHEN' },
        { id: 'cat-b', target_station: 'BAR' },
      ],
      error: null,
    },
    orders: { data: null, error: null },
    order_items: { data: null, error: null },
    tables: { data: null, error: null },
  }
}

const orderInserts = () => calls.filter((c) => c.table === 'orders' && c.method === 'insert')

beforeEach(() => {
  vi.clearAllMocks()
  calls.length = 0
})

describe('POST /api/orders — validación', () => {
  it('400 cuando faltan restaurant_id o items', async () => {
    setupClient(fullResults())
    const { POST } = await import('../app/api/orders/route')
    expect((await POST(makePost({ restaurant_id: '', items: [] }))).status).toBe(400)
  })

  it('404 cuando el restaurante no existe o está inactivo', async () => {
    setupClient({ ...fullResults(), restaurants: { data: null, error: null } })
    const { POST } = await import('../app/api/orders/route')
    const res = await POST(makePost({ restaurant_id: 'r1', table_id: 't1', total_amount: 1000, items: [kitchenItem] }))
    expect(res.status).toBe(404)
  })

  it('400 cuando algún ítem no pertenece al restaurante', async () => {
    setupClient({ ...fullResults(), menu_items: { data: [{ id: 'mi-k', category_id: 'cat-k' }], error: null } })
    const { POST } = await import('../app/api/orders/route')
    // se piden 2 ítems pero solo 1 existe en el restaurante → inválido
    const res = await POST(
      makePost({ restaurant_id: 'r1', table_id: 't1', total_amount: 2000, items: [kitchenItem, barItem] }),
    )
    expect(res.status).toBe(400)
  })

  it('500 cuando la query de menu_items falla', async () => {
    setupClient({ ...fullResults(), menu_items: { data: null, error: { message: 'db fail' } } })
    const { POST } = await import('../app/api/orders/route')
    const res = await POST(makePost({ restaurant_id: 'r1', table_id: 't1', total_amount: 1000, items: [kitchenItem] }))
    expect(res.status).toBe(500)
  })
})

describe('POST /api/orders — split por estación', () => {
  it('201 con un solo sub-pedido KITCHEN cuando todos los ítems son de cocina', async () => {
    setupClient({
      ...fullResults(),
      menu_items: { data: [{ id: 'mi-k', category_id: 'cat-k' }], error: null },
      categories: { data: [{ id: 'cat-k', target_station: 'KITCHEN' }], error: null },
    })
    const { POST } = await import('../app/api/orders/route')
    const res = await POST(makePost({ restaurant_id: 'r1', table_id: 't1', total_amount: 1000, items: [kitchenItem] }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.orderIds).toHaveLength(1)
    const inserts = orderInserts()
    expect(inserts).toHaveLength(1)
    expect(inserts[0].payload.station).toBe('KITCHEN')
  })

  it('201 con dos sub-pedidos (KITCHEN + BAR) y parent_order_id en el de barra', async () => {
    setupClient(fullResults())
    const { POST } = await import('../app/api/orders/route')
    const res = await POST(
      makePost({ restaurant_id: 'r1', table_id: 't1', total_amount: 2000, items: [kitchenItem, barItem] }),
    )
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.orderIds).toHaveLength(2)

    const inserts = orderInserts()
    expect(inserts.map((c) => c.payload.station)).toEqual(['KITCHEN', 'BAR'])
    // el sub-pedido de barra referencia al de cocina como parent
    expect(inserts[1].payload.parent_order_id).toBe(inserts[0].payload.id)
  })

  it('marca la mesa como OCCUPIED cuando hay table_id', async () => {
    setupClient(fullResults())
    const { POST } = await import('../app/api/orders/route')
    await POST(makePost({ restaurant_id: 'r1', table_id: 't1', total_amount: 2000, items: [kitchenItem, barItem] }))
    const tableUpdate = calls.find((c) => c.table === 'tables' && c.method === 'update')
    expect(tableUpdate?.payload).toMatchObject({ status: 'OCCUPIED' })
  })

  it('500 cuando falla la inserción del pedido', async () => {
    setupClient({
      ...fullResults(),
      menu_items: { data: [{ id: 'mi-k', category_id: 'cat-k' }], error: null },
      categories: { data: [{ id: 'cat-k', target_station: 'KITCHEN' }], error: null },
      orders: { data: null, error: { message: 'insert fail' } },
    })
    const { POST } = await import('../app/api/orders/route')
    const res = await POST(makePost({ restaurant_id: 'r1', table_id: 't1', total_amount: 1000, items: [kitchenItem] }))
    expect(res.status).toBe(500)
  })
})

describe('POST /api/orders — session de mesa fusionada', () => {
  it('hereda el current_session_id de la mesa en todos los sub-pedidos', async () => {
    setupClient({ ...fullResults(), tables: { data: { current_session_id: 'sess-merged' }, error: null } })
    const { POST } = await import('../app/api/orders/route')
    const res = await POST(
      makePost({ restaurant_id: 'r1', table_id: 't1', total_amount: 2000, items: [kitchenItem, barItem] }),
    )
    expect(res.status).toBe(201)
    const inserts = orderInserts()
    expect(inserts).toHaveLength(2)
    // Ambos sub-pedidos (KITCHEN y BAR) comparten el session_id de la mesa fusionada,
    // para que la caja los agrupe en una sola cuenta.
    expect(inserts.every((c) => c.payload.session_id === 'sess-merged')).toBe(true)
  })

  it('session_id null cuando la mesa no está fusionada', async () => {
    setupClient({
      ...fullResults(),
      menu_items: { data: [{ id: 'mi-k', category_id: 'cat-k' }], error: null },
      categories: { data: [{ id: 'cat-k', target_station: 'KITCHEN' }], error: null },
      tables: { data: { current_session_id: null }, error: null },
    })
    const { POST } = await import('../app/api/orders/route')
    await POST(makePost({ restaurant_id: 'r1', table_id: 't1', total_amount: 1000, items: [kitchenItem] }))
    const inserts = orderInserts()
    expect(inserts[0].payload.session_id).toBeNull()
  })
})
