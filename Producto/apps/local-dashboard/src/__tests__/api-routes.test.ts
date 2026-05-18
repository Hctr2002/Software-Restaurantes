/**
 * Tests for local-dashboard API routes:
 * - GET/POST /api/local/menu
 * - GET/POST /api/local/tables
 * - GET/POST/PATCH/DELETE /api/local/theme
 * - PUT /api/local/profile
 * - GET /api/local/stats
 */

import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Mock @/lib/localApi ──────────────────────────────────────────────────────
const mockEnsureServiceConfig = vi.fn()
const mockRequireAdmin = vi.fn()
const mockCreateServiceClient = vi.fn()
const mockCreateSessionClient = vi.fn()

vi.mock('@/lib/localApi', () => ({
  ensureServiceConfig: () => mockEnsureServiceConfig(),
  requireAdmin: (...args: any[]) => mockRequireAdmin(...args),
  createServiceClient: () => mockCreateServiceClient(),
  createSessionClient: (...args: any[]) => mockCreateSessionClient(...args),
}))

// ─── Mock services ────────────────────────────────────────────────────────────
const mockMenuService = { getByRestaurant: vi.fn(), create: vi.fn() }
const mockTableService = { getByRestaurant: vi.fn(), create: vi.fn() }
const mockThemeService = {
  getByRestaurant: vi.fn(),
  save: vi.fn(),
  activate: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
}

vi.mock('@/lib/services/menuService', () => ({ menuService: mockMenuService }))
vi.mock('@/lib/services/tableService', () => ({ tableService: mockTableService }))
vi.mock('@/lib/services/themeService', () => ({ themeService: mockThemeService }))

// ─── Supabase chain helper ────────────────────────────────────────────────────
function makeChain(resolved: any = { data: null, error: null }) {
  const chain: any = {}
  chain.then = (resolve: any) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: any) => Promise.resolve(resolved).catch(reject)
  ;['eq', 'neq', 'not', 'order', 'in', 'limit', 'filter', 'gte', 'lte'].forEach((m) => {
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

function setupAdmin(restaurantId = 'r1') {
  mockEnsureServiceConfig.mockReturnValue(null)
  mockRequireAdmin.mockResolvedValue({ user: { id: 'u1' }, restaurantId })
}

function setupUnauth() {
  mockEnsureServiceConfig.mockReturnValue(null)
  mockRequireAdmin.mockResolvedValue({
    errorResponse: new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 }),
  })
}

function makePost(body: object, url = 'http://localhost/api'): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeGet(url: string): NextRequest {
  return new NextRequest(url)
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/local/menu
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/local/menu', () => {
  it('retorna 401 cuando no hay sesión de admin', async () => {
    setupUnauth()
    const { GET } = await import('../app/api/local/menu/route')
    const res = await GET(makeGet('http://localhost/api/local/menu'))
    expect(res!.status).toBe(401)
  })

  it('retorna 200 con lista de items del menú', async () => {
    setupAdmin()
    mockMenuService.getByRestaurant.mockResolvedValue({ data: [{ id: 'm1', name: 'Burger' }], error: null })
    const { GET } = await import('../app/api/local/menu/route')
    const res = await GET(makeGet('http://localhost/api/local/menu'))
    expect(res!.status).toBe(200)
    const json = await res!.json()
    expect(Array.isArray(json.data)).toBe(true)
  })

  it('retorna 500 cuando el servicio falla', async () => {
    setupAdmin()
    mockMenuService.getByRestaurant.mockResolvedValue({ data: null, error: { message: 'DB fail' } })
    const { GET } = await import('../app/api/local/menu/route')
    const res = await GET(makeGet('http://localhost/api/local/menu'))
    expect(res!.status).toBe(500)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/local/menu
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/local/menu', () => {
  it('retorna 401 cuando no hay sesión', async () => {
    setupUnauth()
    const { POST } = await import('../app/api/local/menu/route')
    const res = await POST(makePost({ name: 'Burger', price: 5000 }))
    expect(res!.status).toBe(401)
  })

  it('retorna 400 con payload inválido (Zod)', async () => {
    setupAdmin()
    const { POST } = await import('../app/api/local/menu/route')
    const res = await POST(makePost({}))
    expect(res!.status).toBe(400)
    const json = await res!.json()
    expect(json.error).toBeTruthy()
  })

  it('retorna 201 con item creado', async () => {
    setupAdmin()
    mockMenuService.create.mockResolvedValue({ data: { id: 'm1', name: 'Burger' }, error: null })
    const { POST } = await import('../app/api/local/menu/route')
    const res = await POST(makePost({
      name: 'Burger',
      price: 5000,
      category_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      is_active: true,
    }))
    expect(res!.status).toBe(201)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/local/tables
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/local/tables', () => {
  it('retorna 401 cuando no hay sesión', async () => {
    setupUnauth()
    const { GET } = await import('../app/api/local/tables/route')
    const res = await GET(makeGet('http://localhost/api/local/tables'))
    expect(res!.status).toBe(401)
  })

  it('retorna 200 con lista de mesas', async () => {
    setupAdmin()
    mockTableService.getByRestaurant.mockResolvedValue({ data: [{ id: 't1', number: 1 }], error: null })
    const { GET } = await import('../app/api/local/tables/route')
    const res = await GET(makeGet('http://localhost/api/local/tables'))
    expect(res!.status).toBe(200)
    const json = await res!.json()
    expect(Array.isArray(json.data)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/local/tables
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/local/tables', () => {
  it('retorna 400 con payload inválido', async () => {
    setupAdmin()
    const { POST } = await import('../app/api/local/tables/route')
    const res = await POST(makePost({}))
    expect(res!.status).toBe(400)
  })

  it('retorna 201 con mesa creada', async () => {
    setupAdmin()
    mockTableService.create.mockResolvedValue({ data: { id: 't1', number: 5 }, error: null })
    const { POST } = await import('../app/api/local/tables/route')
    const res = await POST(makePost({ number: 5 }))
    expect(res!.status).toBe(201)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/local/theme
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/local/theme', () => {
  it('retorna 401 cuando no hay sesión', async () => {
    setupUnauth()
    const { GET } = await import('../app/api/local/theme/route')
    const res = await GET(makeGet('http://localhost/api/local/theme'))
    expect(res!.status).toBe(401)
  })

  it('retorna 200 con lista de temas', async () => {
    setupAdmin()
    mockThemeService.getByRestaurant.mockResolvedValue({ data: [{ id: 'th1' }], error: null })
    const { GET } = await import('../app/api/local/theme/route')
    const res = await GET(makeGet('http://localhost/api/local/theme'))
    expect(res!.status).toBe(200)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/local/theme
// ─────────────────────────────────────────────────────────────────────────────
const VALID_THEME = {
  name: 'Default',
  primaryColor: '#ff0000',
  secondaryColor: '#00ff00',
  accentColor: '#0000ff',
  backgroundColor: '#ffffff',
  textColor: '#000000',
  cardBackground: '#f0f0f0',
}

describe('POST /api/local/theme', () => {
  it('retorna 201 con tema creado', async () => {
    setupAdmin()
    mockThemeService.save.mockResolvedValue({ data: { id: 'th1' }, error: null })
    const { POST } = await import('../app/api/local/theme/route')
    const res = await POST(makePost(VALID_THEME))
    expect(res!.status).toBe(201)
  })

  it('retorna 400 con payload inválido', async () => {
    setupAdmin()
    const { POST } = await import('../app/api/local/theme/route')
    const res = await POST(makePost({}))
    expect(res!.status).toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/local/theme
// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/local/theme', () => {
  it('activa un tema con action=activate', async () => {
    setupAdmin()
    mockThemeService.activate.mockResolvedValue({ data: { id: 'th1', is_active: true }, error: null })
    const { PATCH } = await import('../app/api/local/theme/route')
    const res = await PATCH(new NextRequest('http://localhost/api/local/theme', {
      method: 'PATCH',
      body: JSON.stringify({ themeId: 'th1', action: 'activate' }),
      headers: { 'Content-Type': 'application/json' },
    }))
    expect(res!.status).toBe(200)
  })

  it('retorna 400 cuando action no es válida', async () => {
    setupAdmin()
    const { PATCH } = await import('../app/api/local/theme/route')
    const res = await PATCH(new NextRequest('http://localhost/api/local/theme', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'invalid' }),
      headers: { 'Content-Type': 'application/json' },
    }))
    expect(res!.status).toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/local/theme
// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/local/theme', () => {
  it('retorna 400 cuando falta themeId', async () => {
    setupAdmin()
    const { DELETE } = await import('../app/api/local/theme/route')
    const req = new NextRequest('http://localhost/api/local/theme', { method: 'DELETE' })
    const res = await DELETE(req)
    expect(res!.status).toBe(400)
  })

  it('retorna 200 al eliminar tema por themeId', async () => {
    setupAdmin()
    mockThemeService.delete.mockResolvedValue({ error: null })
    const { DELETE } = await import('../app/api/local/theme/route')
    const req = new NextRequest('http://localhost/api/local/theme?themeId=th1', { method: 'DELETE' })
    const res = await DELETE(req)
    expect(res!.status).toBe(200)
  })

  it('retorna 200 al eliminar múltiples temas por themeIds', async () => {
    setupAdmin()
    mockThemeService.deleteMany.mockResolvedValue({ error: null })
    const { DELETE } = await import('../app/api/local/theme/route')
    const req = new NextRequest('http://localhost/api/local/theme?themeIds=th1,th2', { method: 'DELETE' })
    const res = await DELETE(req)
    expect(res!.status).toBe(200)
    const json = await res!.json()
    expect(json.deleted).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/local/profile
// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/local/profile', () => {
  it('retorna 401 cuando no hay sesión', async () => {
    setupUnauth()
    const { PUT } = await import('../app/api/local/profile/route')
    const req = new NextRequest('http://localhost/api/local/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Nuevo' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res!.status).toBe(401)
  })

  it('retorna 400 cuando no hay datos para actualizar', async () => {
    setupAdmin()
    const { PUT } = await import('../app/api/local/profile/route')
    const req = new NextRequest('http://localhost/api/local/profile', {
      method: 'PUT',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res!.status).toBe(400)
  })

  it('retorna 200 al actualizar nombre exitosamente', async () => {
    setupAdmin()
    mockCreateSessionClient.mockReturnValue({
      auth: { updateUser: vi.fn().mockResolvedValue({ error: null }) },
    })
    const { PUT } = await import('../app/api/local/profile/route')
    const req = new NextRequest('http://localhost/api/local/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Carlos' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res!.status).toBe(200)
    const json = await res!.json()
    expect(json.success).toBe(true)
  })

  it('retorna 500 cuando auth.updateUser falla', async () => {
    setupAdmin()
    mockCreateSessionClient.mockReturnValue({
      auth: { updateUser: vi.fn().mockResolvedValue({ error: { message: 'update fail' } }) },
    })
    const { PUT } = await import('../app/api/local/profile/route')
    const req = new NextRequest('http://localhost/api/local/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Carlos' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res!.status).toBe(500)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/local/stats
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/local/stats', () => {
  it('retorna 401 cuando no hay sesión', async () => {
    setupUnauth()
    const { GET } = await import('../app/api/local/stats/route')
    const res = await GET(makeGet('http://localhost/api/local/stats'))
    expect(res!.status).toBe(401)
  })

  it('retorna 200 con KPIs del día y del mes', async () => {
    setupAdmin()
    mockCreateServiceClient.mockReturnValue({
      from: vi.fn().mockReturnValue(makeChain({ data: [], error: null })),
    })
    const { GET } = await import('../app/api/local/stats/route')
    const res = await GET(makeGet('http://localhost/api/local/stats'))
    expect(res!.status).toBe(200)
    const json = await res!.json()
    expect(json.data).toHaveProperty('ingresos_dia')
    expect(json.data).toHaveProperty('ingresos_mes')
    expect(json.data).toHaveProperty('ticket_promedio')
  })
})
