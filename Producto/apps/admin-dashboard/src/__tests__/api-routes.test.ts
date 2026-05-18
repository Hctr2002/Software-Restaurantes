/**
 * Tests for admin-dashboard API routes:
 * - GET/POST /api/admin/restaurants
 * - GET/POST /api/admin/users
 * - GET/POST /api/admin/plans
 * - GET /api/admin/profile
 */

import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Supabase chain helper ────────────────────────────────────────────────────
function makeChain(resolved: any = { data: null, error: null }) {
  const chain: any = {}
  chain.then = (resolve: any) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: any) => Promise.resolve(resolved).catch(reject)
  ;['eq', 'neq', 'not', 'order', 'in', 'limit', 'filter'].forEach((m) => {
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

// ─── Mock @/lib/adminApi ─────────────────────────────────────────────────────
const mockEnsureServiceConfig = vi.fn()
const mockRequireSuperAdmin = vi.fn()
const mockCreateServiceClient = vi.fn()

vi.mock('@/lib/adminApi', () => ({
  ensureServiceConfig: () => mockEnsureServiceConfig(),
  requireSuperAdmin: (...args: any[]) => mockRequireSuperAdmin(...args),
  createServiceClient: () => mockCreateServiceClient(),
}))

function setupSuperAdmin() {
  mockEnsureServiceConfig.mockReturnValue(null)
  mockRequireSuperAdmin.mockResolvedValue({ user: { id: 'u1', app_metadata: { role: 'SUPER_ADMIN' } } })
}

function setupServiceClient(chain = makeChain()) {
  mockCreateServiceClient.mockReturnValue({ from: vi.fn().mockReturnValue(chain) })
}

function makeReq(body: object, method = 'POST'): NextRequest {
  return new NextRequest('http://localhost/api', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/restaurants
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/admin/restaurants', () => {
  it('retorna 500 cuando faltan variables de entorno', async () => {
    mockEnsureServiceConfig.mockReturnValue(
      new Response(JSON.stringify({ error: 'Faltan variables' }), { status: 500 })
    )
    const { GET } = await import('../app/api/admin/restaurants/route')
    const req = new NextRequest('http://localhost/api/admin/restaurants')
    const res = await GET(req)
    expect(res.status).toBe(500)
  })

  it('retorna 401 cuando no hay sesión de super-admin', async () => {
    mockEnsureServiceConfig.mockReturnValue(null)
    mockRequireSuperAdmin.mockResolvedValue({
      errorResponse: new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 }),
    })
    const { GET } = await import('../app/api/admin/restaurants/route')
    const req = new NextRequest('http://localhost/api/admin/restaurants')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('retorna 200 con lista de restaurantes', async () => {
    setupSuperAdmin()
    setupServiceClient(makeChain({ data: [{ id: 'r1', name: 'Restaurante A' }], error: null }))
    const { GET } = await import('../app/api/admin/restaurants/route')
    const req = new NextRequest('http://localhost/api/admin/restaurants')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.data)).toBe(true)
  })

  it('retorna 400 cuando DB falla', async () => {
    setupSuperAdmin()
    setupServiceClient(makeChain({ data: null, error: { message: 'DB fail' } }))
    const { GET } = await import('../app/api/admin/restaurants/route')
    const req = new NextRequest('http://localhost/api/admin/restaurants')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/restaurants
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/admin/restaurants', () => {
  it('retorna 400 cuando faltan name y slug', async () => {
    setupSuperAdmin()
    setupServiceClient()
    const { POST } = await import('../app/api/admin/restaurants/route')
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
  })

  it('retorna 201 con restaurante creado', async () => {
    setupSuperAdmin()
    const chain = makeChain()
    chain.single = vi.fn().mockResolvedValue({
      data: { id: 'r2', name: 'Nuevo', slug: 'nuevo' },
      error: null,
    })
    setupServiceClient(chain)
    const { POST } = await import('../app/api/admin/restaurants/route')
    const res = await POST(makeReq({ name: 'Nuevo', slug: 'nuevo' }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.data.slug).toBe('nuevo')
  })

  it('retorna 400 cuando DB retorna error en insert', async () => {
    setupSuperAdmin()
    const chain = makeChain()
    chain.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'slug duplicado' } })
    setupServiceClient(chain)
    const { POST } = await import('../app/api/admin/restaurants/route')
    const res = await POST(makeReq({ name: 'Dup', slug: 'dup' }))
    expect(res.status).toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/admin/users', () => {
  it('retorna 401 cuando no hay sesión', async () => {
    mockEnsureServiceConfig.mockReturnValue(null)
    mockRequireSuperAdmin.mockResolvedValue({
      errorResponse: new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 }),
    })
    const { GET } = await import('../app/api/admin/users/route')
    const req = new NextRequest('http://localhost/api/admin/users')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('retorna 200 con lista de usuarios', async () => {
    setupSuperAdmin()
    setupServiceClient(makeChain({ data: [{ id: 'u1', email: 'a@b.com', role: 'ADMIN' }], error: null }))
    const { GET } = await import('../app/api/admin/users/route')
    const req = new NextRequest('http://localhost/api/admin/users')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.data)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/users
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/admin/users', () => {
  it('retorna 400 cuando faltan email y password', async () => {
    setupSuperAdmin()
    setupServiceClient()
    const { POST } = await import('../app/api/admin/users/route')
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
  })

  it('retorna 201 con usuario creado', async () => {
    setupSuperAdmin()
    mockCreateServiceClient.mockReturnValue({
      from: vi.fn().mockReturnValue(makeChain()),
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'u2', email: 'nuevo@test.com' } },
            error: null,
          }),
        },
      },
    })
    const { POST } = await import('../app/api/admin/users/route')
    const res = await POST(makeReq({ email: 'nuevo@test.com', password: 'pass123', role: 'ADMIN' }))
    expect(res.status).toBe(201)
  })

  it('retorna 400 cuando Supabase auth retorna error', async () => {
    setupSuperAdmin()
    mockCreateServiceClient.mockReturnValue({
      from: vi.fn().mockReturnValue(makeChain()),
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'email duplicado' },
          }),
        },
      },
    })
    const { POST } = await import('../app/api/admin/users/route')
    const res = await POST(makeReq({ email: 'dup@test.com', password: 'pass123' }))
    expect(res.status).toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/plans
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/admin/plans', () => {
  it('retorna 200 con lista de planes', async () => {
    setupSuperAdmin()
    setupServiceClient(makeChain({ data: [{ id: 'p1', name: 'Basic' }], error: null }))
    const { GET } = await import('../app/api/admin/plans/route')
    const req = new NextRequest('http://localhost/api/admin/plans')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.data)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/plans
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/admin/plans', () => {
  it('retorna 400 cuando faltan name y price', async () => {
    setupSuperAdmin()
    setupServiceClient()
    const { POST } = await import('../app/api/admin/plans/route')
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
  })

  it('retorna 201 con plan creado', async () => {
    setupSuperAdmin()
    const chain = makeChain()
    chain.single = vi.fn().mockResolvedValue({
      data: { id: 'p2', name: 'Pro', price: 29900 },
      error: null,
    })
    setupServiceClient(chain)
    const { POST } = await import('../app/api/admin/plans/route')
    const res = await POST(makeReq({ name: 'Pro', price: 29900 }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.data.name).toBe('Pro')
  })
})
