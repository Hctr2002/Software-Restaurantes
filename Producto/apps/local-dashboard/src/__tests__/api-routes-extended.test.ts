/**
 * Tests de las rutas API de local-dashboard que no cubría api-routes.test.ts:
 *  - GET    /api/local/alerts
 *  - PUT    /api/local/alerts/[id]
 *  - GET/POST /api/local/categories       · PUT/DELETE /api/local/categories/[id]
 *  - GET/POST /api/local/inventory         · PUT/DELETE /api/local/inventory/[id]
 *  - POST   /api/local/inventory/import
 *  - PUT/DELETE /api/local/menu/[id]
 *  - GET    /api/local/orders              · PUT /api/local/orders/[id]
 *  - PUT/DELETE /api/local/tables/[id]
 *  - GET/POST /api/local/users             · PUT/DELETE /api/local/users/[id]
 *
 * Estrategia: se mockea @/lib/localApi (guard de auth + clientes) y los services,
 * se importan los handlers reales y se asertan los códigos de estado de cada rama.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

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

// ─── Mock services (menu/[id] y tables/[id] los usan) ────────────────────────
const mockMenuService = { update: vi.fn(), delete: vi.fn() }
const mockTableService = { update: vi.fn(), delete: vi.fn() }
vi.mock('@/lib/services/menuService', () => ({ menuService: mockMenuService }))
vi.mock('@/lib/services/tableService', () => ({ tableService: mockTableService }))

// ─── Helpers de Supabase ──────────────────────────────────────────────────────
function makeChain(resolved: any = { data: null, error: null }) {
  const chain: any = {}
  chain.then = (resolve: any) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: any) => Promise.resolve(resolved).catch(reject)
  ;['eq', 'neq', 'not', 'order', 'in', 'limit', 'filter', 'gte', 'lte', 'select', 'update', 'insert', 'upsert', 'delete'].forEach(
    (m) => {
      chain[m] = vi.fn().mockReturnValue(chain)
    },
  )
  chain.single = vi.fn().mockResolvedValue(resolved)
  return chain
}

const mockAuthAdmin = {
  createUser: vi.fn(),
  updateUserById: vi.fn(),
  deleteUser: vi.fn(),
}

function setupDb(chain = makeChain()) {
  mockCreateServiceClient.mockReturnValue({
    from: vi.fn().mockReturnValue(chain),
    auth: { admin: mockAuthAdmin },
  })
  return chain
}

function setupAdmin(restaurantId = 'r1') {
  mockEnsureServiceConfig.mockReturnValue(null)
  mockRequireAdmin.mockResolvedValue({
    user: { id: 'u1', email: 'admin@r1.com' },
    restaurantId,
  })
}

function setupUnauth() {
  mockEnsureServiceConfig.mockReturnValue(null)
  mockRequireAdmin.mockResolvedValue({
    errorResponse: new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 }),
  })
}

// ─── Helpers de request ───────────────────────────────────────────────────────
const params = (id: string) => ({ params: Promise.resolve({ id }) })
const makeGet = (url: string) => new NextRequest(url)
function makeBody(method: string, body: object, url = 'http://localhost/api') {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
const makePost = (b: object, url?: string) => makeBody('POST', b, url)
const makePut = (b: object) => makeBody('PUT', b)
const makeDelete = () => new NextRequest('http://localhost/api', { method: 'DELETE' })
function makeCsv(text: string) {
  return new NextRequest('http://localhost/api', { method: 'POST', body: text })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ════════════════════════════════════════════════════════════════════════════
// alerts
// ════════════════════════════════════════════════════════════════════════════
describe('GET /api/local/alerts', () => {
  it('401 sin sesión', async () => {
    setupUnauth()
    const { GET } = await import('../app/api/local/alerts/route')
    expect((await GET(makeGet('http://localhost/api/local/alerts'))).status).toBe(401)
  })
  it('200 con alertas', async () => {
    setupAdmin()
    setupDb(makeChain({ data: [{ id: 'al1' }], error: null }))
    const { GET } = await import('../app/api/local/alerts/route')
    const res = await GET(makeGet('http://localhost/api/local/alerts?status=PENDING'))
    expect(res.status).toBe(200)
    expect(Array.isArray((await res.json()).data)).toBe(true)
  })
  it('500 si la BD falla', async () => {
    setupAdmin()
    setupDb(makeChain({ data: null, error: { message: 'boom' } }))
    const { GET } = await import('../app/api/local/alerts/route')
    expect((await GET(makeGet('http://localhost/api/local/alerts'))).status).toBe(500)
  })
})

describe('PUT /api/local/alerts/[id]', () => {
  it('401 sin sesión', async () => {
    setupUnauth()
    const { PUT } = await import('../app/api/local/alerts/[id]/route')
    expect((await PUT(makePut({ action: 'resolve' }), params('al1'))).status).toBe(401)
  })
  it('200 resuelve la alerta', async () => {
    setupAdmin()
    setupDb(makeChain({ data: { id: 'al1', status: 'RESOLVED' }, error: null }))
    const { PUT } = await import('../app/api/local/alerts/[id]/route')
    expect((await PUT(makePut({ action: 'resolve' }), params('al1'))).status).toBe(200)
  })
  it('200 con action=disable_item también desactiva el ítem', async () => {
    setupAdmin()
    setupDb(makeChain({ data: { id: 'al1' }, error: null }))
    const { PUT } = await import('../app/api/local/alerts/[id]/route')
    const res = await PUT(makePut({ action: 'disable_item', menuItemId: UUID }), params('al1'))
    expect(res.status).toBe(200)
  })
  it('500 si el update falla', async () => {
    setupAdmin()
    setupDb(makeChain({ data: null, error: { message: 'fail' } }))
    const { PUT } = await import('../app/api/local/alerts/[id]/route')
    expect((await PUT(makePut({ action: 'resolve' }), params('al1'))).status).toBe(500)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// categories
// ════════════════════════════════════════════════════════════════════════════
describe('/api/local/categories', () => {
  it('GET 401 sin sesión', async () => {
    setupUnauth()
    const { GET } = await import('../app/api/local/categories/route')
    expect((await GET(makeGet('http://localhost/api/local/categories'))).status).toBe(401)
  })
  it('GET 200 lista', async () => {
    setupAdmin()
    setupDb(makeChain({ data: [{ id: 'c1' }], error: null }))
    const { GET } = await import('../app/api/local/categories/route')
    expect((await GET(makeGet('http://localhost/api/local/categories'))).status).toBe(200)
  })
  it('POST 400 sin nombre', async () => {
    setupAdmin()
    setupDb()
    const { POST } = await import('../app/api/local/categories/route')
    expect((await POST(makePost({ name: '   ' }))).status).toBe(400)
  })
  it('POST 201 crea', async () => {
    setupAdmin()
    setupDb(makeChain({ data: { id: 'c1', name: 'Bebidas' }, error: null }))
    const { POST } = await import('../app/api/local/categories/route')
    expect((await POST(makePost({ name: 'Bebidas', target_station: 'BAR' }))).status).toBe(201)
  })
  it('POST 500 si falla insert', async () => {
    setupAdmin()
    setupDb(makeChain({ data: null, error: { message: 'x' } }))
    const { POST } = await import('../app/api/local/categories/route')
    expect((await POST(makePost({ name: 'Bebidas' }))).status).toBe(500)
  })
})

describe('/api/local/categories/[id]', () => {
  it('PUT 200 actualiza', async () => {
    setupAdmin()
    setupDb(makeChain({ data: { id: 'c1' }, error: null }))
    const { PUT } = await import('../app/api/local/categories/[id]/route')
    expect((await PUT(makePut({ name: 'X' }), params('c1'))).status).toBe(200)
  })
  it('PUT 404 si no existe', async () => {
    setupAdmin()
    setupDb(makeChain({ data: null, error: null }))
    const { PUT } = await import('../app/api/local/categories/[id]/route')
    expect((await PUT(makePut({ name: 'X' }), params('c1'))).status).toBe(404)
  })
  it('DELETE 200', async () => {
    setupAdmin()
    setupDb(makeChain({ data: null, error: null }))
    const { DELETE } = await import('../app/api/local/categories/[id]/route')
    expect((await DELETE(makeDelete(), params('c1'))).status).toBe(200)
  })
  it('DELETE 500 si falla (FK)', async () => {
    setupAdmin()
    setupDb(makeChain({ data: null, error: { message: 'FK violation' } }))
    const { DELETE } = await import('../app/api/local/categories/[id]/route')
    expect((await DELETE(makeDelete(), params('c1'))).status).toBe(500)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// inventory
// ════════════════════════════════════════════════════════════════════════════
describe('/api/local/inventory', () => {
  it('GET 401 sin sesión', async () => {
    setupUnauth()
    const { GET } = await import('../app/api/local/inventory/route')
    expect((await GET(makeGet('http://localhost/api/local/inventory'))).status).toBe(401)
  })
  it('GET 200', async () => {
    setupAdmin()
    setupDb(makeChain({ data: [{ id: 'i1' }], error: null }))
    const { GET } = await import('../app/api/local/inventory/route')
    expect((await GET(makeGet('http://localhost/api/local/inventory'))).status).toBe(200)
  })
  it('POST 400 campos faltantes', async () => {
    setupAdmin()
    setupDb()
    const { POST } = await import('../app/api/local/inventory/route')
    expect((await POST(makePost({ name: 'Sal' }))).status).toBe(400)
  })
  it('POST 201 crea insumo', async () => {
    setupAdmin()
    setupDb(makeChain({ data: { id: 'i1' }, error: null }))
    const { POST } = await import('../app/api/local/inventory/route')
    expect((await POST(makePost({ name: 'Sal', stock: 10, unit: 'kg' }))).status).toBe(201)
  })
})

describe('/api/local/inventory/[id]', () => {
  it('PUT 200', async () => {
    setupAdmin()
    setupDb(makeChain({ data: { id: 'i1' }, error: null }))
    const { PUT } = await import('../app/api/local/inventory/[id]/route')
    expect((await PUT(makePut({ name: 'Sal', stock: 5, unit: 'kg' }), params('i1'))).status).toBe(200)
  })
  it('PUT 404 si no existe', async () => {
    setupAdmin()
    setupDb(makeChain({ data: null, error: null }))
    const { PUT } = await import('../app/api/local/inventory/[id]/route')
    expect((await PUT(makePut({ name: 'Sal', stock: 5, unit: 'kg' }), params('i1'))).status).toBe(404)
  })
  it('DELETE 200', async () => {
    setupAdmin()
    setupDb(makeChain({ data: null, error: null }))
    const { DELETE } = await import('../app/api/local/inventory/[id]/route')
    expect((await DELETE(makeDelete(), params('i1'))).status).toBe(200)
  })
})

describe('POST /api/local/inventory/import', () => {
  it('401 sin sesión', async () => {
    setupUnauth()
    const { POST } = await import('../app/api/local/inventory/import/route')
    expect((await POST(makeCsv('id,stock_actual\n1,5'))).status).toBe(401)
  })
  it('400 CSV vacío', async () => {
    setupAdmin()
    const { POST } = await import('../app/api/local/inventory/import/route')
    expect((await POST(makeCsv('id,stock_actual'))).status).toBe(400)
  })
  it('400 si faltan columnas requeridas', async () => {
    setupAdmin()
    const { POST } = await import('../app/api/local/inventory/import/route')
    expect((await POST(makeCsv('nombre,cantidad\nSal,5'))).status).toBe(400)
  })
  it('200 actualiza filas válidas y reporta inválidas', async () => {
    setupAdmin()
    setupDb(makeChain({ data: [], error: null }))
    const { POST } = await import('../app/api/local/inventory/import/route')
    const res = await POST(makeCsv('id,stock_actual\nitem-1,10\nitem-2,abc\nitem-3,-5\nitem-4,7'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.updated).toBe(2) // item-1 e item-4
    expect(json.errors.length).toBe(2) // item-2 (NaN) e item-3 (negativo)
    expect(Array.isArray(json.critical)).toBe(true)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// menu/[id] (usa menuService + menuSchema)
// ════════════════════════════════════════════════════════════════════════════
describe('/api/local/menu/[id]', () => {
  const valid = { name: 'Burger', price: 5000, category_id: UUID, is_active: true }
  it('PUT 401 sin sesión', async () => {
    setupUnauth()
    const { PUT } = await import('../app/api/local/menu/[id]/route')
    expect((await PUT(makePut(valid), params('m1'))).status).toBe(401)
  })
  it('PUT 400 con payload inválido (Zod)', async () => {
    setupAdmin()
    const { PUT } = await import('../app/api/local/menu/[id]/route')
    expect((await PUT(makePut({ name: '' }), params('m1'))).status).toBe(400)
  })
  it('PUT 200 actualiza', async () => {
    setupAdmin()
    mockMenuService.update.mockResolvedValue({ data: { id: 'm1' }, error: null })
    const { PUT } = await import('../app/api/local/menu/[id]/route')
    expect((await PUT(makePut(valid), params('m1'))).status).toBe(200)
  })
  it('PUT 404 si no existe', async () => {
    setupAdmin()
    mockMenuService.update.mockResolvedValue({ data: null, error: null })
    const { PUT } = await import('../app/api/local/menu/[id]/route')
    expect((await PUT(makePut(valid), params('m1'))).status).toBe(404)
  })
  it('DELETE 200', async () => {
    setupAdmin()
    mockMenuService.delete.mockResolvedValue({ error: null })
    const { DELETE } = await import('../app/api/local/menu/[id]/route')
    expect((await DELETE(makeDelete(), params('m1'))).status).toBe(200)
  })
  it('DELETE 500 si falla', async () => {
    setupAdmin()
    mockMenuService.delete.mockResolvedValue({ error: { message: 'x' } })
    const { DELETE } = await import('../app/api/local/menu/[id]/route')
    expect((await DELETE(makeDelete(), params('m1'))).status).toBe(500)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// orders
// ════════════════════════════════════════════════════════════════════════════
describe('GET /api/local/orders', () => {
  it('401 sin sesión', async () => {
    setupUnauth()
    const { GET } = await import('../app/api/local/orders/route')
    expect((await GET(makeGet('http://localhost/api/local/orders'))).status).toBe(401)
  })
  it('200 con filtros y cap de límite a 2000', async () => {
    setupAdmin()
    const chain = setupDb(makeChain({ data: [{ id: 'o1' }], error: null }))
    const { GET } = await import('../app/api/local/orders/route')
    const res = await GET(
      makeGet('http://localhost/api/local/orders?from=2026-01-01&to=2026-12-31&status=READY&limit=5000'),
    )
    expect(res.status).toBe(200)
    expect(chain.limit).toHaveBeenCalledWith(2000)
    expect(chain.gte).toHaveBeenCalled()
    expect(chain.lte).toHaveBeenCalled()
  })
  it('200 ignora status=ALL', async () => {
    setupAdmin()
    setupDb(makeChain({ data: [], error: null }))
    const { GET } = await import('../app/api/local/orders/route')
    expect((await GET(makeGet('http://localhost/api/local/orders?status=ALL'))).status).toBe(200)
  })
  it('500 si la BD falla', async () => {
    setupAdmin()
    setupDb(makeChain({ data: null, error: { message: 'x' } }))
    const { GET } = await import('../app/api/local/orders/route')
    expect((await GET(makeGet('http://localhost/api/local/orders'))).status).toBe(500)
  })
})

describe('PUT /api/local/orders/[id]', () => {
  it('400 con estado inválido', async () => {
    setupAdmin()
    setupDb()
    const { PUT } = await import('../app/api/local/orders/[id]/route')
    expect((await PUT(makePut({ status: 'FLYING' }), params('o1'))).status).toBe(400)
  })
  it('200 con transición válida', async () => {
    setupAdmin()
    setupDb(makeChain({ data: { id: 'o1', status: 'READY' }, error: null }))
    const { PUT } = await import('../app/api/local/orders/[id]/route')
    expect((await PUT(makePut({ status: 'READY' }), params('o1'))).status).toBe(200)
  })
  it('404 si el pedido no existe', async () => {
    setupAdmin()
    setupDb(makeChain({ data: null, error: null }))
    const { PUT } = await import('../app/api/local/orders/[id]/route')
    expect((await PUT(makePut({ status: 'READY' }), params('o1'))).status).toBe(404)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// tables/[id] (usa tableService + tableSchema)
// ════════════════════════════════════════════════════════════════════════════
describe('/api/local/tables/[id]', () => {
  it('PUT 400 con payload inválido (Zod)', async () => {
    setupAdmin()
    const { PUT } = await import('../app/api/local/tables/[id]/route')
    expect((await PUT(makePut({ number: -1 }), params('t1'))).status).toBe(400)
  })
  it('PUT 200 actualiza', async () => {
    setupAdmin()
    mockTableService.update.mockResolvedValue({ data: { id: 't1' }, error: null })
    const { PUT } = await import('../app/api/local/tables/[id]/route')
    expect((await PUT(makePut({ number: 5 }), params('t1'))).status).toBe(200)
  })
  it('DELETE 200', async () => {
    setupAdmin()
    mockTableService.delete.mockResolvedValue({ error: null })
    const { DELETE } = await import('../app/api/local/tables/[id]/route')
    expect((await DELETE(makeDelete(), params('t1'))).status).toBe(200)
  })
  it('DELETE 409 si tiene órdenes activas', async () => {
    setupAdmin()
    mockTableService.delete.mockResolvedValue({ error: { message: 'La mesa tiene una orden activa' } })
    const { DELETE } = await import('../app/api/local/tables/[id]/route')
    expect((await DELETE(makeDelete(), params('t1'))).status).toBe(409)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// users (Auth Admin API)
// ════════════════════════════════════════════════════════════════════════════
describe('/api/local/users', () => {
  it('GET 200 lista', async () => {
    setupAdmin()
    setupDb(makeChain({ data: [{ id: 'u2', email: 'g@r.com', role: 'GARZON' }], error: null }))
    const { GET } = await import('../app/api/local/users/route')
    expect((await GET(makeGet('http://localhost/api/local/users'))).status).toBe(200)
  })
  it('POST 400 sin email/contraseña', async () => {
    setupAdmin()
    setupDb()
    const { POST } = await import('../app/api/local/users/route')
    expect((await POST(makePost({ email: '', password: '' }))).status).toBe(400)
  })
  it('POST 400 con rol inválido', async () => {
    setupAdmin()
    setupDb()
    const { POST } = await import('../app/api/local/users/route')
    expect((await POST(makePost({ email: 'a@b.com', password: 'secret', role: 'JEFE' }))).status).toBe(400)
  })
  it('POST 201 crea usuario', async () => {
    setupAdmin()
    setupDb()
    mockAuthAdmin.createUser.mockResolvedValue({ data: { user: { id: 'u9' } }, error: null })
    const { POST } = await import('../app/api/local/users/route')
    expect((await POST(makePost({ email: 'a@b.com', password: 'secret', role: 'GARZON' }))).status).toBe(201)
  })
  it('POST 400 si Auth rechaza (email duplicado)', async () => {
    setupAdmin()
    setupDb()
    mockAuthAdmin.createUser.mockResolvedValue({ data: null, error: { message: 'already registered' } })
    const { POST } = await import('../app/api/local/users/route')
    expect((await POST(makePost({ email: 'a@b.com', password: 'secret', role: 'GARZON' }))).status).toBe(400)
  })
})

describe('/api/local/users/[id]', () => {
  it('PUT 400 con rol inválido', async () => {
    setupAdmin()
    setupDb()
    const { PUT } = await import('../app/api/local/users/[id]/route')
    expect((await PUT(makePut({ role: 'JEFE' }), params('u2'))).status).toBe(400)
  })
  it('PUT 404 si el usuario es de otro restaurante', async () => {
    setupAdmin()
    setupDb(makeChain({ data: { restaurant_id: 'otro' }, error: null }))
    const { PUT } = await import('../app/api/local/users/[id]/route')
    expect((await PUT(makePut({ role: 'GARZON' }), params('u2'))).status).toBe(404)
  })
  it('PUT 200 actualiza', async () => {
    setupAdmin()
    setupDb(makeChain({ data: { restaurant_id: 'r1' }, error: null }))
    mockAuthAdmin.updateUserById.mockResolvedValue({ data: { id: 'u2' }, error: null })
    const { PUT } = await import('../app/api/local/users/[id]/route')
    expect((await PUT(makePut({ role: 'GARZON' }), params('u2'))).status).toBe(200)
  })
  it('DELETE 400 al intentar auto-eliminarse', async () => {
    setupAdmin()
    setupDb()
    const { DELETE } = await import('../app/api/local/users/[id]/route')
    // setupAdmin → user.id = 'u1'
    expect((await DELETE(makeDelete(), params('u1'))).status).toBe(400)
  })
  it('DELETE 404 si es de otro restaurante', async () => {
    setupAdmin()
    setupDb(makeChain({ data: { restaurant_id: 'otro' }, error: null }))
    const { DELETE } = await import('../app/api/local/users/[id]/route')
    expect((await DELETE(makeDelete(), params('u2'))).status).toBe(404)
  })
  it('DELETE 200 elimina usuario del mismo restaurante', async () => {
    setupAdmin()
    setupDb(makeChain({ data: { restaurant_id: 'r1' }, error: null }))
    mockAuthAdmin.deleteUser.mockResolvedValue({ error: null })
    const { DELETE } = await import('../app/api/local/users/[id]/route')
    expect((await DELETE(makeDelete(), params('u2'))).status).toBe(200)
  })
})
