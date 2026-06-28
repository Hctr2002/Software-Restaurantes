/**
 * Tests for customer-portal API routes.
 * Uses a promisified Supabase chain so that methods can be both chained
 * and awaited (via .then()), matching how supabase-js actually works.
 */

import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Supabase chain: every method is chainable AND awaitable ────────────────
function makeChain(resolved: any = { data: null, error: null }) {
  const chain: any = {}

  // Make chain a thenable so `await chain` works
  chain.then = (resolve: any) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: any) => Promise.resolve(resolved).catch(reject)

  const chainMethods = ['eq', 'not', 'order', 'in', 'limit', 'neq', 'gt', 'gte', 'lt', 'lte', 'is', 'contains', 'filter']
  chainMethods.forEach((m) => { chain[m] = vi.fn().mockReturnValue(chain) })

  // select and update return new chain instances (could be terminal)
  chain.select = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.upsert = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(resolved)

  return chain
}

const mockCreateClient = vi.fn()
vi.mock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn().mockReturnValue({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: vi.fn().mockReturnValue(makeChain()),
  }),
}))
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn().mockReturnValue([]), setAll: vi.fn() }),
}))

function makeReq(body: object, method = 'POST', url = 'http://localhost/api'): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function setupClient(perTable: Record<string, any> = {}, defaultResolved: any = { data: null, error: null }) {
  const defaultChain = makeChain(defaultResolved)
  mockCreateClient.mockReturnValue({
    from: vi.fn((tableName: string) => perTable[tableName] ?? defaultChain),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bill-request
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/bill-request', () => {
  it('retorna 400 cuando faltan parámetros', async () => {
    setupClient()
    const { POST } = await import('../app/api/bill-request/route')
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeTruthy()
  })

  it('retorna 200 con parámetros válidos', async () => {
    setupClient()
    const { POST } = await import('../app/api/bill-request/route')
    const res = await POST(makeReq({ table_id: 't-1', restaurant_id: 'r-1', table_number: 3 }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('retorna 500 cuando DB retorna error en update', async () => {
    const errChain = makeChain({ error: { message: 'DB error' } })
    setupClient({ tables: errChain })
    const { POST } = await import('../app/api/bill-request/route')
    const res = await POST(makeReq({ table_id: 't-1', restaurant_id: 'r-1', table_number: 3 }))
    expect(res.status).toBe(500)
  })

  it('guarda el monto de propina y deriva tip_included=true', async () => {
    const tables = makeChain()
    setupClient({ tables })
    const { POST } = await import('../app/api/bill-request/route')
    const res = await POST(makeReq({ table_id: 't-1', restaurant_id: 'r-1', table_number: 3, tip_amount: 2500 }))
    expect(res.status).toBe(200)
    expect(tables.update).toHaveBeenCalledWith(expect.objectContaining({ bill_requested: true, tip_included: true, tip_amount: 2500 }))
  })

  it('tip_amount=0 → sin propina (tip_included=false)', async () => {
    const tables = makeChain()
    setupClient({ tables })
    const { POST } = await import('../app/api/bill-request/route')
    await POST(makeReq({ table_id: 't-1', restaurant_id: 'r-1', table_number: 3, tip_amount: 0 }))
    expect(tables.update).toHaveBeenCalledWith(expect.objectContaining({ tip_included: false, tip_amount: 0 }))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/help-request
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/help-request', () => {
  it('retorna 400 cuando faltan parámetros', async () => {
    setupClient()
    const { POST } = await import('../app/api/help-request/route')
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
  })

  it('retorna 200 con parámetros válidos', async () => {
    setupClient()
    const { POST } = await import('../app/api/help-request/route')
    const res = await POST(makeReq({ table_id: 't-1', restaurant_id: 'r-1' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('retorna 500 cuando DB retorna error', async () => {
    const errChain = makeChain({ error: { message: 'fail' } })
    setupClient({ tables: errChain })
    const { POST } = await import('../app/api/help-request/route')
    const res = await POST(makeReq({ table_id: 't-1', restaurant_id: 'r-1' }))
    expect(res.status).toBe(500)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/orders', () => {
  it('retorna 400 cuando falta table_id', async () => {
    setupClient()
    const { GET } = await import('../app/api/orders/route')
    const req = new NextRequest('http://localhost/api/orders')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('retorna 200 con table_id válido y datos vacíos', async () => {
    const ordersChain = makeChain({ data: [], error: null })
    setupClient({ orders: ordersChain })
    const { GET } = await import('../app/api/orders/route')
    const req = new NextRequest('http://localhost/api/orders?table_id=table-1')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
  })

  it('retorna 500 cuando la BD falla', async () => {
    const errChain = makeChain({ data: null, error: { message: 'fail' } })
    setupClient({ orders: errChain })
    const { GET } = await import('../app/api/orders/route')
    const req = new NextRequest('http://localhost/api/orders?table_id=table-1')
    const res = await GET(req)
    expect(res.status).toBe(500)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/orders', () => {
  it('retorna 400 cuando faltan campos obligatorios', async () => {
    setupClient()
    const { POST } = await import('../app/api/orders/route')
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
  })

  it('retorna 400 cuando items está vacío', async () => {
    setupClient()
    const { POST } = await import('../app/api/orders/route')
    const res = await POST(makeReq({ restaurant_id: 'r-1', items: [] }))
    expect(res.status).toBe(400)
  })

  it('retorna 404 cuando el restaurante no existe', async () => {
    const restChain = makeChain({ data: null, error: { message: 'not found' } })
    restChain.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
    setupClient({ restaurants: restChain })
    const { POST } = await import('../app/api/orders/route')
    const res = await POST(makeReq({
      restaurant_id: 'r-1',
      table_id: null,
      total_amount: 5000,
      items: [{ menu_item_id: 'item-1', quantity: 2, unit_price: 2500 }],
    }))
    expect(res.status).toBe(404)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reviews
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/reviews', () => {
  it('retorna 400 cuando faltan parámetros obligatorios', async () => {
    setupClient()
    const { POST } = await import('../app/api/reviews/route')
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
  })

  it('retorna 400 cuando rating es 0', async () => {
    setupClient()
    const { POST } = await import('../app/api/reviews/route')
    const res = await POST(makeReq({ order_id: 'o-1', restaurant_id: 'r-1', rating: 0 }))
    expect(res.status).toBe(400)
  })

  it('retorna 400 cuando rating es mayor a 5', async () => {
    setupClient()
    const { POST } = await import('../app/api/reviews/route')
    const res = await POST(makeReq({ order_id: 'o-1', restaurant_id: 'r-1', rating: 6 }))
    expect(res.status).toBe(400)
  })

  it('retorna 200 con datos válidos', async () => {
    setupClient()
    const { POST } = await import('../app/api/reviews/route')
    const res = await POST(makeReq({ order_id: 'o-1', restaurant_id: 'r-1', rating: 5, comment: 'Excelente' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('retorna 500 cuando DB retorna error al insertar', async () => {
    const errChain = makeChain({ error: { message: 'DB fail' } })
    setupClient({ reviews: errChain })
    const { POST } = await import('../app/api/reviews/route')
    const res = await POST(makeReq({ order_id: 'o-1', restaurant_id: 'r-1', rating: 4 }))
    expect(res.status).toBe(500)
  })
})
