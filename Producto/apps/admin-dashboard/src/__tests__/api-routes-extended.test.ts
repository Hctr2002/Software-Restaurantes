/**
 * Tests de las rutas API [id] de admin-dashboard no cubiertas por api-routes.test.ts:
 *  - PUT/DELETE /api/admin/plans/[id]
 *  - PUT/DELETE /api/admin/restaurants/[id]
 *  - PUT/DELETE /api/admin/users/[id]   (Auth Admin API)
 *  - PUT        /api/admin/profile      (Auth Admin API)
 *
 * Las rutas admin devuelven 400 (no 500) ante errores de BD/Auth.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

function makeChain(resolved: any = { data: null, error: null }) {
  const chain: any = {}
  chain.then = (resolve: any) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: any) => Promise.resolve(resolved).catch(reject)
  ;['eq', 'neq', 'not', 'order', 'in', 'limit', 'filter', 'select', 'update', 'insert', 'upsert', 'delete'].forEach(
    (m) => {
      chain[m] = vi.fn().mockReturnValue(chain)
    },
  )
  chain.single = vi.fn().mockResolvedValue(resolved)
  return chain
}

const mockEnsureServiceConfig = vi.fn()
const mockRequireSuperAdmin = vi.fn()
const mockCreateServiceClient = vi.fn()

vi.mock('@/lib/adminApi', () => ({
  ensureServiceConfig: () => mockEnsureServiceConfig(),
  requireSuperAdmin: (...args: any[]) => mockRequireSuperAdmin(...args),
  createServiceClient: () => mockCreateServiceClient(),
}))

const mockAuthAdmin = { updateUserById: vi.fn(), deleteUser: vi.fn() }

function setupSuperAdmin() {
  mockEnsureServiceConfig.mockReturnValue(null)
  mockRequireSuperAdmin.mockResolvedValue({
    user: { id: 'u1', email: 'super@admin.com', app_metadata: { role: 'SUPER_ADMIN' } },
  })
}
function setupUnauth() {
  mockEnsureServiceConfig.mockReturnValue(null)
  mockRequireSuperAdmin.mockResolvedValue({
    errorResponse: new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 }),
  })
}
function setupDb(chain = makeChain()) {
  mockCreateServiceClient.mockReturnValue({
    from: vi.fn().mockReturnValue(chain),
    auth: { admin: mockAuthAdmin },
  })
  return chain
}

const params = (id: string) => ({ params: Promise.resolve({ id }) })
const makePut = (b: object) =>
  new NextRequest('http://localhost/api', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(b),
  })
const makeDelete = () => new NextRequest('http://localhost/api', { method: 'DELETE' })

beforeEach(() => vi.clearAllMocks())

// ════════════════════════════════════════════════════════════════════════════
describe('PUT/DELETE /api/admin/plans/[id]', () => {
  it('PUT 500 si faltan variables de entorno', async () => {
    mockEnsureServiceConfig.mockReturnValue(
      new Response(JSON.stringify({ error: 'Faltan variables' }), { status: 500 }),
    )
    const { PUT } = await import('../app/api/admin/plans/[id]/route')
    expect((await PUT(makePut({ name: 'Pro' }), params('p1'))).status).toBe(500)
  })
  it('PUT 401 sin super-admin', async () => {
    setupUnauth()
    const { PUT } = await import('../app/api/admin/plans/[id]/route')
    expect((await PUT(makePut({ name: 'Pro' }), params('p1'))).status).toBe(401)
  })
  it('PUT 200 actualiza el plan', async () => {
    setupSuperAdmin()
    setupDb(makeChain({ data: { id: 'p1', name: 'Pro' }, error: null }))
    const { PUT } = await import('../app/api/admin/plans/[id]/route')
    expect((await PUT(makePut({ name: 'Pro', price: 9990 }), params('p1'))).status).toBe(200)
  })
  it('PUT 400 si la BD falla', async () => {
    setupSuperAdmin()
    setupDb(makeChain({ data: null, error: { message: 'fail' } }))
    const { PUT } = await import('../app/api/admin/plans/[id]/route')
    expect((await PUT(makePut({ name: 'Pro' }), params('p1'))).status).toBe(400)
  })
  it('DELETE 200', async () => {
    setupSuperAdmin()
    setupDb(makeChain({ data: null, error: null }))
    const { DELETE } = await import('../app/api/admin/plans/[id]/route')
    expect((await DELETE(makeDelete(), params('p1'))).status).toBe(200)
  })
  it('DELETE 400 si la BD falla', async () => {
    setupSuperAdmin()
    setupDb(makeChain({ data: null, error: { message: 'fail' } }))
    const { DELETE } = await import('../app/api/admin/plans/[id]/route')
    expect((await DELETE(makeDelete(), params('p1'))).status).toBe(400)
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('PUT/DELETE /api/admin/restaurants/[id]', () => {
  it('PUT 200 actualiza campos provistos', async () => {
    setupSuperAdmin()
    setupDb(makeChain({ data: { id: 'r1', name: 'A' }, error: null }))
    const { PUT } = await import('../app/api/admin/restaurants/[id]/route')
    const res = await PUT(makePut({ name: 'A', slug: 'a', status: 'ACTIVE', planId: 'p1' }), params('r1'))
    expect(res.status).toBe(200)
  })
  it('PUT 400 si la BD falla', async () => {
    setupSuperAdmin()
    setupDb(makeChain({ data: null, error: { message: 'dup slug' } }))
    const { PUT } = await import('../app/api/admin/restaurants/[id]/route')
    expect((await PUT(makePut({ slug: 'a' }), params('r1'))).status).toBe(400)
  })
  it('DELETE 200 ({ ok: true })', async () => {
    setupSuperAdmin()
    setupDb(makeChain({ data: null, error: null }))
    const { DELETE } = await import('../app/api/admin/restaurants/[id]/route')
    const res = await DELETE(makeDelete(), params('r1'))
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })
  it('DELETE 400 si la BD falla', async () => {
    setupSuperAdmin()
    setupDb(makeChain({ data: null, error: { message: 'FK' } }))
    const { DELETE } = await import('../app/api/admin/restaurants/[id]/route')
    expect((await DELETE(makeDelete(), params('r1'))).status).toBe(400)
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('PUT/DELETE /api/admin/users/[id]', () => {
  it('PUT 200 actualiza vía Auth Admin', async () => {
    setupSuperAdmin()
    setupDb()
    mockAuthAdmin.updateUserById.mockResolvedValue({ data: { user: { id: 'u2' } }, error: null })
    const { PUT } = await import('../app/api/admin/users/[id]/route')
    const res = await PUT(makePut({ email: 'x@y.com', role: 'ADMIN', restaurantId: 'r1' }), params('u2'))
    expect(res.status).toBe(200)
    expect(mockAuthAdmin.updateUserById).toHaveBeenCalled()
  })
  it('PUT 400 si Auth rechaza', async () => {
    setupSuperAdmin()
    setupDb()
    mockAuthAdmin.updateUserById.mockResolvedValue({ data: null, error: { message: 'bad' } })
    const { PUT } = await import('../app/api/admin/users/[id]/route')
    expect((await PUT(makePut({ role: 'ADMIN' }), params('u2'))).status).toBe(400)
  })
  it('DELETE 400 al auto-eliminarse (mismo id que el super-admin)', async () => {
    setupSuperAdmin()
    setupDb()
    const { DELETE } = await import('../app/api/admin/users/[id]/route')
    expect((await DELETE(makeDelete(), params('u1'))).status).toBe(400)
    expect(mockAuthAdmin.deleteUser).not.toHaveBeenCalled()
  })
  it('DELETE 200 elimina otro usuario', async () => {
    setupSuperAdmin()
    setupDb()
    mockAuthAdmin.deleteUser.mockResolvedValue({ error: null })
    const { DELETE } = await import('../app/api/admin/users/[id]/route')
    expect((await DELETE(makeDelete(), params('u2'))).status).toBe(200)
  })
  it('DELETE 400 si Auth rechaza', async () => {
    setupSuperAdmin()
    setupDb()
    mockAuthAdmin.deleteUser.mockResolvedValue({ error: { message: 'bad' } })
    const { DELETE } = await import('../app/api/admin/users/[id]/route')
    expect((await DELETE(makeDelete(), params('u2'))).status).toBe(400)
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('PUT /api/admin/profile', () => {
  it('401 sin super-admin', async () => {
    setupUnauth()
    const { PUT } = await import('../app/api/admin/profile/route')
    expect((await PUT(makePut({ name: 'Nuevo' }))).status).toBe(401)
  })
  it('200 actualiza nombre/contraseña', async () => {
    setupSuperAdmin()
    setupDb()
    mockAuthAdmin.updateUserById.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    const { PUT } = await import('../app/api/admin/profile/route')
    const res = await PUT(makePut({ name: 'Nuevo', password: 'secret123' }))
    expect(res.status).toBe(200)
    expect(mockAuthAdmin.updateUserById).toHaveBeenCalledWith('u1', expect.any(Object))
  })
  it('400 si Auth rechaza', async () => {
    setupSuperAdmin()
    setupDb()
    mockAuthAdmin.updateUserById.mockResolvedValue({ data: null, error: { message: 'weak password' } })
    const { PUT } = await import('../app/api/admin/profile/route')
    expect((await PUT(makePut({ password: '123' }))).status).toBe(400)
  })
})
