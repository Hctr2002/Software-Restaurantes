/**
 * Tests de POST /api/push/notify — envío de Web Push a los garzones del restaurante.
 * Mockea `web-push` (default export) y `@supabase/supabase-js`.
 * Las VAPID keys se leen al importar el módulo, por eso usamos resetModules + stubEnv
 * antes de cada import dinámico.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockSendNotification = vi.fn()
const mockSetVapidDetails = vi.fn()
vi.mock('web-push', () => ({
  default: { setVapidDetails: mockSetVapidDetails, sendNotification: mockSendNotification },
}))

const mockCreateClient = vi.fn()
vi.mock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }))

function makeChain(resolved: any = { data: null, error: null }) {
  const chain: any = {}
  chain.then = (resolve: any) => Promise.resolve(resolved).then(resolve)
  ;['eq', 'in', 'select', 'delete'].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain)
  })
  return chain
}
function setupDb(chain = makeChain()) {
  mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(chain) })
  return chain
}

const makePost = (body: object) =>
  new NextRequest('http://localhost/api/push/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

function configureVapid(enabled: boolean) {
  if (enabled) {
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'pub-key')
    vi.stubEnv('VAPID_PRIVATE_KEY', 'priv-key')
  } else {
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', '')
    vi.stubEnv('VAPID_PRIVATE_KEY', '')
  }
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'svc')
}

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})
afterEach(() => vi.unstubAllEnvs())

describe('POST /api/push/notify', () => {
  it('503 cuando las VAPID keys no están configuradas', async () => {
    configureVapid(false)
    const { POST } = await import('../app/api/push/notify/route')
    expect((await POST(makePost({ restaurantId: 'r1' }))).status).toBe(503)
  })

  it('400 cuando falta restaurantId', async () => {
    configureVapid(true)
    setupDb()
    const { POST } = await import('../app/api/push/notify/route')
    expect((await POST(makePost({}))).status).toBe(400)
  })

  it('200 sent:0 cuando no hay suscripciones', async () => {
    configureVapid(true)
    setupDb(makeChain({ data: [], error: null }))
    const { POST } = await import('../app/api/push/notify/route')
    const res = await POST(makePost({ restaurantId: 'r1' }))
    expect(res.status).toBe(200)
    expect((await res.json()).sent).toBe(0)
  })

  it('200 envía a todas las suscripciones', async () => {
    configureVapid(true)
    setupDb(
      makeChain({
        data: [
          { subscription: { endpoint: 'e1' } },
          { subscription: { endpoint: 'e2' } },
        ],
        error: null,
      }),
    )
    mockSendNotification.mockResolvedValue({})
    const { POST } = await import('../app/api/push/notify/route')
    const res = await POST(makePost({ restaurantId: 'r1', tableNumber: 7 }))
    expect(res.status).toBe(200)
    expect((await res.json()).sent).toBe(2)
    expect(mockSendNotification).toHaveBeenCalledTimes(2)
  })

  it('limpia suscripciones expiradas (410 Gone)', async () => {
    configureVapid(true)
    const chain = setupDb(
      makeChain({ data: [{ subscription: { endpoint: 'stale-1' } }], error: null }),
    )
    mockSendNotification.mockRejectedValue({ statusCode: 410 })
    const { POST } = await import('../app/api/push/notify/route')
    const res = await POST(makePost({ restaurantId: 'r1' }))
    expect(res.status).toBe(200)
    expect((await res.json()).sent).toBe(0)
    // se invoca el borrado de las suscripciones expiradas
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.in).toHaveBeenCalledWith('subscription->>endpoint', ['stale-1'])
  })
})
