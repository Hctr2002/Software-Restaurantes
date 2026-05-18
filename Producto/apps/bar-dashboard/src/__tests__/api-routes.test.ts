/**
 * Tests for bar-dashboard API routes:
 * - GET/POST /api/inventory  (CSV export/import de inventario)
 * - GET/POST /api/settings   (configuración KDS barra)
 */

import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Supabase chain helper ────────────────────────────────────────────────────
function makeChain(resolved: any = { data: null, error: null }) {
  const chain: any = {}
  chain.then = (resolve: any) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: any) => Promise.resolve(resolved).catch(reject)
  ;['eq', 'neq', 'not', 'order', 'in', 'limit', 'filter', 'lte', 'gte'].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain)
  })
  chain.select = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.upsert = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(resolved)
  return chain
}

const mockCreateServerClient = vi.fn()
const mockCreateClient = vi.fn()

vi.mock('@supabase/ssr', () => ({ createServerClient: mockCreateServerClient }))
vi.mock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }))
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn().mockReturnValue([]), setAll: vi.fn() }),
}))
vi.mock('@menu-bites/auth', () => ({ CRITICAL_STOCK_THRESHOLD: 5 }))

function setupAuth(restaurantId: string | null) {
  const session = restaurantId
    ? { user: { app_metadata: { restaurant_id: restaurantId } } }
    : null
  mockCreateServerClient.mockReturnValue({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session } }) },
  })
}

function setupServiceClient(chain = makeChain(), extra: Record<string, any> = {}) {
  mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(chain), ...extra })
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/inventory
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/inventory (bar)', () => {
  it('retorna 401 cuando no hay sesión', async () => {
    setupAuth(null)
    setupServiceClient()
    const { GET } = await import('../app/api/inventory/route')
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('retorna 500 cuando DB falla', async () => {
    setupAuth('r1')
    setupServiceClient(makeChain({ data: null, error: { message: 'DB fail' } }))
    const { GET } = await import('../app/api/inventory/route')
    const res = await GET()
    expect(res.status).toBe(500)
  })

  it('retorna 200 CSV cuando hay sesión y datos', async () => {
    setupAuth('r1')
    setupServiceClient(makeChain({
      data: [{ id: 'i1', name: 'Limones', stock: 10, unit: 'kg' }],
      error: null,
    }))
    const { GET } = await import('../app/api/inventory/route')
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/csv')
    const text = await res.text()
    expect(text).toContain('Limones')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/inventory (CSV import)
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/inventory (bar)', () => {
  it('retorna 401 cuando no hay sesión', async () => {
    setupAuth(null)
    setupServiceClient()
    const { POST } = await import('../app/api/inventory/route')
    const req = new NextRequest('http://localhost/api/inventory', {
      method: 'POST',
      body: 'id,stock_actual\ni1,5',
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('retorna 400 con CSV vacío', async () => {
    setupAuth('r1')
    setupServiceClient()
    const { POST } = await import('../app/api/inventory/route')
    const req = new NextRequest('http://localhost/api/inventory', {
      method: 'POST',
      body: '',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 cuando faltan columnas id y stock_actual', async () => {
    setupAuth('r1')
    setupServiceClient()
    const { POST } = await import('../app/api/inventory/route')
    const req = new NextRequest('http://localhost/api/inventory', {
      method: 'POST',
      body: 'nombre,unidad\nLimones,kg',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 200 con updated=1 en CSV válido', async () => {
    setupAuth('r1')
    setupServiceClient(makeChain({ data: [], error: null }))
    const { POST } = await import('../app/api/inventory/route')
    const req = new NextRequest('http://localhost/api/inventory', {
      method: 'POST',
      body: 'id,stock_actual\ni1,10.5',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.updated).toBe(1)
  })

  it('acumula errores cuando el stock es inválido', async () => {
    setupAuth('r1')
    setupServiceClient()
    const { POST } = await import('../app/api/inventory/route')
    const req = new NextRequest('http://localhost/api/inventory', {
      method: 'POST',
      body: 'id,stock_actual\ni1,no-es-numero',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.errors.length).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/settings (bar)
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/settings (bar)', () => {
  it('retorna 401 cuando no hay sesión', async () => {
    setupAuth(null)
    setupServiceClient()
    const { GET } = await import('../app/api/settings/route')
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('retorna null cuando no hay configuración de BAR', async () => {
    setupAuth('r1')
    const chain = makeChain({ data: null, error: { code: 'PGRST116', message: 'not found' } })
    setupServiceClient(chain)
    const { GET } = await import('../app/api/settings/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeNull()
  })

  it('retorna configuración BAR cuando existe', async () => {
    setupAuth('r1')
    const chain = makeChain({ data: { settings: { BAR: { columns: 3 } } }, error: null })
    chain.single = vi.fn().mockResolvedValue({ data: { settings: { BAR: { columns: 3 } } }, error: null })
    setupServiceClient(chain)
    const { GET } = await import('../app/api/settings/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ columns: 3 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/settings (bar)
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/settings (bar)', () => {
  it('retorna 401 cuando no hay sesión', async () => {
    setupAuth(null)
    const req = new NextRequest('http://localhost/api/settings', {
      method: 'POST',
      body: JSON.stringify({ columns: 3 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const { POST } = await import('../app/api/settings/route')
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('retorna 200 con settings guardados correctamente', async () => {
    setupAuth('r1')
    const chain = makeChain()
    setupServiceClient(chain, {
      rpc: vi.fn().mockResolvedValue({ data: { columns: 3 }, error: null }),
    })
    const req = new NextRequest('http://localhost/api/settings', {
      method: 'POST',
      body: JSON.stringify({ columns: 3 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const { POST } = await import('../app/api/settings/route')
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('retorna 500 cuando RPC falla', async () => {
    setupAuth('r1')
    const chain = makeChain()
    setupServiceClient(chain, {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'rpc fail' } }),
    })
    const req = new NextRequest('http://localhost/api/settings', {
      method: 'POST',
      body: JSON.stringify({ columns: 3 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const { POST } = await import('../app/api/settings/route')
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
