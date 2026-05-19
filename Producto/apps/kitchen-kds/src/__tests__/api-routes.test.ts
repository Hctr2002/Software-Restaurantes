/**
 * Tests for kitchen-kds API routes:
 * - GET/POST /api/inventory  (CSV export/import de inventario)
 * - GET/POST /api/settings   (configuración KDS cocina)
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

function setupServiceClient(chain = makeChain()) {
  mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(chain) })
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/inventory
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/inventory (kitchen)', () => {
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
      data: [{ id: 'i1', name: 'Tomates', stock: 5, unit: 'kg' }],
      error: null,
    }))
    const { GET } = await import('../app/api/inventory/route')
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/csv')
    const text = await res.text()
    expect(text).toContain('Tomates')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/inventory (CSV import)
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/inventory (kitchen)', () => {
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

  it('retorna 400 cuando faltan columnas requeridas', async () => {
    setupAuth('r1')
    setupServiceClient()
    const { POST } = await import('../app/api/inventory/route')
    const req = new NextRequest('http://localhost/api/inventory', {
      method: 'POST',
      body: 'nombre,unidad\nTomates,kg',
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
      body: 'id,stock_actual\ni1,8.0',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.updated).toBe(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/settings (kitchen)
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/settings (kitchen)', () => {
  it('retorna 401 cuando no hay sesión', async () => {
    setupAuth(null)
    setupServiceClient()
    const { GET } = await import('../app/api/settings/route')
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('retorna null cuando no hay datos en DB', async () => {
    setupAuth('r1')
    const chain = makeChain()
    chain.single = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'not found' } })
    setupServiceClient(chain)
    const { GET } = await import('../app/api/settings/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeNull()
  })

  it('retorna configuración KITCHEN cuando existe', async () => {
    setupAuth('r1')
    const chain = makeChain()
    chain.single = vi.fn().mockResolvedValue({
      data: { settings: { KITCHEN: { columns: 4 } } },
      error: null,
    })
    setupServiceClient(chain)
    const { GET } = await import('../app/api/settings/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ columns: 4 })
  })

  it('retorna settings raíz cuando no hay KITCHEN ni BAR (compatibilidad)', async () => {
    setupAuth('r1')
    const chain = makeChain()
    chain.single = vi.fn().mockResolvedValue({
      data: { settings: { columns: 2 } },
      error: null,
    })
    setupServiceClient(chain)
    const { GET } = await import('../app/api/settings/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ columns: 2 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/settings (kitchen)
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/settings (kitchen)', () => {
  it('retorna 401 cuando no hay sesión', async () => {
    setupAuth(null)
    setupServiceClient()
    const { POST } = await import('../app/api/settings/route')
    const req = new NextRequest('http://localhost/api/settings', {
      method: 'POST',
      body: JSON.stringify({ columns: 4 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('retorna 200 con settings de KITCHEN guardados', async () => {
    setupAuth('r1')
    const chain = makeChain()
    chain.single = vi.fn().mockResolvedValue({
      data: { settings: { KITCHEN: { columns: 4 } } },
      error: null,
    })
    setupServiceClient(chain)
    const req = new NextRequest('http://localhost/api/settings', {
      method: 'POST',
      body: JSON.stringify({ columns: 4 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const { POST } = await import('../app/api/settings/route')
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('retorna 500 cuando upsert falla', async () => {
    setupAuth('r1')
    const chain = makeChain()
    chain.single = vi.fn()
      .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
      .mockResolvedValue({ data: null, error: { message: 'upsert fail' } })
    setupServiceClient(chain)
    const req = new NextRequest('http://localhost/api/settings', {
      method: 'POST',
      body: JSON.stringify({ columns: 4 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const { POST } = await import('../app/api/settings/route')
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
