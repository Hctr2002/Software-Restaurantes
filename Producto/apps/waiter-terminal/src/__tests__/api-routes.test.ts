/**
 * Tests for waiter-terminal API routes:
 * - POST/DELETE /api/push/subscribe  (VAPID push subscription management)
 * - POST/DELETE /api/sessions        (table merge/unlink)
 */

import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Supabase chain helper ───────────────────────────────────────────────────
function makeChain(resolved: any = { data: null, error: null }) {
  const chain: any = {}
  chain.then = (resolve: any) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: any) => Promise.resolve(resolved).catch(reject)
  ;['eq', 'not', 'order', 'in', 'limit', 'neq', 'filter'].forEach((m) => {
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

const mockCreateClient = vi.fn()
const mockCreateServerClient = vi.fn()

vi.mock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }))
vi.mock('@supabase/ssr', () => ({ createServerClient: mockCreateServerClient }))
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn().mockReturnValue([]), setAll: vi.fn() }),
}))
vi.mock('crypto', () => ({ randomUUID: vi.fn().mockReturnValue('mock-uuid-1234') }))

function makeReq(body: object, method = 'POST', url = 'http://localhost/api'): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function setupAuth(session: any) {
  mockCreateServerClient.mockReturnValue({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session } }) },
    from: vi.fn().mockReturnValue(makeChain()),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/push/subscribe
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/push/subscribe', () => {
  it('retorna 401 cuando no hay sesión activa', async () => {
    setupAuth(null)
    mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(makeChain()) })
    const { POST } = await import('../app/api/push/subscribe/route')
    const res = await POST(makeReq({ endpoint: 'https://push.example.com' }))
    expect(res.status).toBe(401)
  })

  it('retorna 400 cuando la suscripción es inválida', async () => {
    setupAuth({ user: { id: 'u1', app_metadata: { restaurant_id: 'r1' } } })
    mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(makeChain()) })
    const { POST } = await import('../app/api/push/subscribe/route')
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
  })

  it('retorna 200 con suscripción válida y sesión activa', async () => {
    setupAuth({ user: { id: 'u1', app_metadata: { restaurant_id: 'r1' } } })
    mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(makeChain()) })
    const { POST } = await import('../app/api/push/subscribe/route')
    const res = await POST(makeReq({ endpoint: 'https://push.example.com', keys: { p256dh: 'k1', auth: 'a1' } }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/push/subscribe
// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/push/subscribe', () => {
  it('retorna 401 cuando no hay sesión activa', async () => {
    setupAuth(null)
    mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(makeChain()) })
    const { DELETE } = await import('../app/api/push/subscribe/route')
    const req = new NextRequest('http://localhost/api/push/subscribe', { method: 'DELETE' })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it('retorna 200 cuando hay sesión activa', async () => {
    setupAuth({ user: { id: 'u1', app_metadata: { restaurant_id: 'r1' } } })
    mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(makeChain()) })
    const { DELETE } = await import('../app/api/push/subscribe/route')
    const req = new NextRequest('http://localhost/api/push/subscribe', { method: 'DELETE' })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sessions (merge tables)
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/sessions', () => {
  it('retorna 401 cuando no hay sesión', async () => {
    setupAuth(null)
    mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(makeChain()) })
    const { POST } = await import('../app/api/sessions/route')
    const res = await POST(makeReq({ tableIds: ['t1', 't2'] }))
    expect(res.status).toBe(401)
  })

  it('retorna 400 cuando se proporcionan menos de 2 mesas', async () => {
    setupAuth({ user: { id: 'u1', app_metadata: { restaurant_id: 'r1' } } })
    mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(makeChain()) })
    const { POST } = await import('../app/api/sessions/route')
    const res = await POST(makeReq({ tableIds: ['t1'] }))
    expect(res.status).toBe(400)
  })

  it('retorna 400 cuando tableIds no es un array', async () => {
    setupAuth({ user: { id: 'u1', app_metadata: { restaurant_id: 'r1' } } })
    mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(makeChain()) })
    const { POST } = await import('../app/api/sessions/route')
    const res = await POST(makeReq({ tableIds: 'not-an-array' }))
    expect(res.status).toBe(400)
  })

  it('retorna 200 y alreadyMerged=true cuando todas las mesas ya tienen el mismo session_id', async () => {
    setupAuth({ user: { id: 'u1', app_metadata: { restaurant_id: 'r1' } } })
    const chain = makeChain({ data: [
      { id: 't1', status: 'OCCUPIED', current_session_id: 'session-1' },
      { id: 't2', status: 'OCCUPIED', current_session_id: 'session-1' },
    ], error: null })
    mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(chain) })
    const { POST } = await import('../app/api/sessions/route')
    const res = await POST(makeReq({ tableIds: ['t1', 't2'] }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.alreadyMerged).toBe(true)
  })

  it('retorna 200 con sessionId cuando no hay sesiones previas', async () => {
    setupAuth({ user: { id: 'u1', app_metadata: { restaurant_id: 'r1' } } })
    const chain = makeChain({ data: [
      { id: 't1', status: 'OCCUPIED', current_session_id: null },
      { id: 't2', status: 'OCCUPIED', current_session_id: null },
    ], error: null })
    mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(chain) })
    const { POST } = await import('../app/api/sessions/route')
    const res = await POST(makeReq({ tableIds: ['t1', 't2'] }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.sessionId).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/sessions (unlink tables)
// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/sessions', () => {
  it('retorna 401 cuando no hay sesión', async () => {
    setupAuth(null)
    mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(makeChain()) })
    const { DELETE } = await import('../app/api/sessions/route')
    const req = new NextRequest('http://localhost/api/sessions', {
      method: 'DELETE',
      body: JSON.stringify({ sessionId: 'session-1' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it('retorna 400 cuando falta sessionId', async () => {
    setupAuth({ user: { id: 'u1', app_metadata: { restaurant_id: 'r1' } } })
    mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(makeChain()) })
    const { DELETE } = await import('../app/api/sessions/route')
    const req = new NextRequest('http://localhost/api/sessions', {
      method: 'DELETE',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })

  it('retorna 200 al desvincular sesión válida', async () => {
    setupAuth({ user: { id: 'u1', app_metadata: { restaurant_id: 'r1' } } })
    const chain = makeChain({ data: [{ id: 't1' }], error: null })
    mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(chain) })
    const { DELETE } = await import('../app/api/sessions/route')
    const req = new NextRequest('http://localhost/api/sessions', {
      method: 'DELETE',
      body: JSON.stringify({ sessionId: 'session-1' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })
})
