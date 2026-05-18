/**
 * Tests for the manage-users Supabase Edge Function.
 * Strategy: vi.mock() captures the serve() handler before the module loads,
 * then each test calls the handler directly with a mock Request.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

// ─── Capture the handler registered with serve() ─────────────────────────────
let handler: (req: Request) => Promise<Response>

vi.mock('https://deno.land/std@0.168.0/http/server.ts', () => ({
  serve: (fn: (req: Request) => Promise<Response>) => { handler = fn },
}))

// ─── Mock Supabase createClient ───────────────────────────────────────────────
const mockCreateClient = vi.fn()
vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({
  createClient: (...args: any[]) => mockCreateClient(...args),
}))

// ─── Load the module (triggers serve(), setting handler) ─────────────────────
beforeAll(async () => {
  await import('../manage-users/index.ts')
})

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeChain(resolved: any = { data: null, error: null }) {
  const chain: any = {}
  chain.then = (resolve: any) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: any) => Promise.resolve(resolved).catch(reject)
  ;['eq', 'neq', 'order', 'in', 'delete'].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain)
  })
  chain.select = vi.fn().mockReturnValue(chain)
  chain.upsert = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(resolved)
  return chain
}

function makeRequest(body: object, method = 'POST'): Request {
  return new Request('https://test.supabase.co/functions/v1/manage-users', {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token',
    },
    body: JSON.stringify(body),
  })
}

function setupUserClient(user: any, profile: any) {
  const profileChain = makeChain()
  profileChain.single = vi.fn().mockResolvedValue({ data: profile, error: profile ? null : { message: 'not found' } })
  mockCreateClient.mockReturnValueOnce({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: user ? null : new Error('bad token') }) },
    from: vi.fn().mockReturnValue(profileChain),
  })
}

function setupAdminClient(overrides: Record<string, any> = {}) {
  const defaultChain = makeChain({ data: [{ id: 'u2' }], error: null })
  mockCreateClient.mockReturnValueOnce({
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue(
          overrides.createUser ?? { data: { user: { id: 'new-user-id' } }, error: null }
        ),
        deleteUser: vi.fn().mockResolvedValue(
          overrides.deleteUser ?? { error: null }
        ),
      },
    },
    from: vi.fn().mockReturnValue(defaultChain),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// CORS preflight
// ─────────────────────────────────────────────────────────────────────────────
describe('manage-users edge function', () => {
  it('responde a preflight OPTIONS con 200', async () => {
    const req = new Request('https://test.supabase.co/functions/v1/manage-users', {
      method: 'OPTIONS',
    })
    const res = await handler(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })

  it('retorna error cuando falta el header Authorization', async () => {
    const req = new Request('https://test.supabase.co/functions/v1/manage-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create' }),
    })
    const res = await handler(req)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toBeTruthy()
  })

  it('retorna error cuando el token es inválido (getUser falla)', async () => {
    setupUserClient(null, null)
    const res = await handler(makeRequest({ action: 'create' }))
    const json = await res.json()
    expect(json.success).toBe(false)
  })

  it('retorna error cuando el perfil de usuario no existe', async () => {
    setupUserClient({ id: 'u1' }, null)
    const res = await handler(makeRequest({ action: 'create' }))
    const json = await res.json()
    expect(json.success).toBe(false)
  })

  it('retorna error cuando el usuario no tiene rol ADMIN', async () => {
    setupUserClient(
      { id: 'u1' },
      { role: 'CAJERO', restaurant_id: 'r1' }
    )
    const res = await handler(makeRequest({ action: 'create' }))
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toContain('administradores')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// action = 'create'
// ─────────────────────────────────────────────────────────────────────────────
describe('manage-users: action=create', () => {
  it('crea usuario y sincroniza DB con éxito', async () => {
    setupUserClient({ id: 'u1' }, { role: 'ADMIN', restaurant_id: 'r1' })
    setupAdminClient()
    const res = await handler(makeRequest({
      action: 'create',
      email: 'nuevo@test.com',
      password: 'pass1234',
      role: 'GARZON',
    }))
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.message).toContain('created')
  })

  it('retorna error cuando Supabase auth.admin.createUser falla', async () => {
    setupUserClient({ id: 'u1' }, { role: 'ADMIN', restaurant_id: 'r1' })
    setupAdminClient({ createUser: { data: null, error: new Error('email duplicado') } })
    const res = await handler(makeRequest({
      action: 'create',
      email: 'dup@test.com',
      password: 'pass',
      role: 'GARZON',
    }))
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toContain('email duplicado')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// action = 'delete'
// ─────────────────────────────────────────────────────────────────────────────
describe('manage-users: action=delete', () => {
  it('elimina usuario de DB y Auth con éxito', async () => {
    setupUserClient({ id: 'u1' }, { role: 'ADMIN', restaurant_id: 'r1' })
    setupAdminClient()
    const res = await handler(makeRequest({ action: 'delete', id: 'target-user-id' }))
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.message).toContain('deleted')
  })

  it('retorna error cuando auth.admin.deleteUser falla', async () => {
    setupUserClient({ id: 'u1' }, { role: 'ADMIN', restaurant_id: 'r1' })
    setupAdminClient({ deleteUser: { error: new Error('usuario no encontrado') } })
    const res = await handler(makeRequest({ action: 'delete', id: 'ghost-id' }))
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toContain('usuario no encontrado')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Acción inválida
// ─────────────────────────────────────────────────────────────────────────────
describe('manage-users: acción inválida', () => {
  it('retorna error cuando action no existe', async () => {
    setupUserClient({ id: 'u1' }, { role: 'ADMIN', restaurant_id: 'r1' })
    const res = await handler(makeRequest({ action: 'update' }))
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toContain('update')
  })
})
