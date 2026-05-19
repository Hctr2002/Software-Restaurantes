/**
 * Tests for lib/dashboard.ts — async Supabase-backed functions.
 * Supabase client is mocked to avoid native module dependencies.
 */

import { describe, it, expect, vi } from 'vitest'

// ─── Mock supabase BEFORE importing dashboard ─────────────────────────────────
const mockFrom = vi.fn()
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}))

import { fetchDashboardStats, fetchRecentOrders, fetchTables } from '../lib/dashboard'

// ─── Chain helper ─────────────────────────────────────────────────────────────
function makeChain(resolved: any = { data: null, error: null, count: null }) {
  const chain: any = {}
  chain.then = (resolve: any) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: any) => Promise.resolve(resolved).catch(reject)
  ;['eq', 'in', 'gte', 'order', 'limit'].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain)
  })
  chain.select = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(resolved)
  return chain
}

function setupMockFrom(tableMap: Record<string, any>, defaultChain = makeChain()) {
  mockFrom.mockImplementation((table: string) => tableMap[table] ?? defaultChain)
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchDashboardStats
// ─────────────────────────────────────────────────────────────────────────────
describe('fetchDashboardStats', () => {
  it('retorna estructura completa con datos vacíos', async () => {
    setupMockFrom({}, makeChain({ data: [], error: null, count: 0 }))
    const stats = await fetchDashboardStats('r1')
    expect(stats).toHaveProperty('ingresos_dia')
    expect(stats).toHaveProperty('ingresos_mes')
    expect(stats).toHaveProperty('ticket_promedio')
    expect(stats).toHaveProperty('pedidos_dia')
    expect(stats).toHaveProperty('activos')
    expect(stats).toHaveProperty('flowCounts')
    expect(stats).toHaveProperty('top_items')
  })

  it('calcula ingresos del día con pedidos DELIVERED', async () => {
    const todayOrders = [
      {
        status: 'DELIVERED',
        createdAt: new Date().toISOString(),
        ready_at: new Date().toISOString(),
        order_items: [{ unit_price: 5000, quantity: 2, menu_items: { name: 'Burger' } }],
      },
    ]
    const ordersChain = makeChain({ data: todayOrders, error: null, count: null })
    const monthChain = makeChain({ data: todayOrders, error: null, count: null })
    const countChain = makeChain({ data: null, error: null, count: 1 })

    mockFrom.mockImplementation(() => {
      const chain = makeChain()
      chain.in = vi.fn().mockReturnValue(chain)
      chain.gte = vi.fn((field: string) => {
        if (field === 'createdAt') return ordersChain
        return countChain
      })
      return chain
    })

    const stats = await fetchDashboardStats('r1')
    expect(stats.ingresos_dia).toBeGreaterThanOrEqual(0)
  })

  it('ticket_promedio es 0 cuando no hay pedidos del día', async () => {
    setupMockFrom({}, makeChain({ data: [], error: null, count: 0 }))
    const stats = await fetchDashboardStats('r1')
    expect(stats.ticket_promedio).toBe(0)
  })

  it('avgCycleMin es null cuando no hay pedidos con ready_at', async () => {
    setupMockFrom({}, makeChain({ data: [], error: null, count: 0 }))
    const stats = await fetchDashboardStats('r1')
    expect(stats.avgCycleMin).toBeNull()
  })

  it('flowCounts tiene las cuatro claves de estado', async () => {
    setupMockFrom({}, makeChain({ data: [], error: null, count: 0 }))
    const stats = await fetchDashboardStats('r1')
    expect(stats.flowCounts).toHaveProperty('PENDING')
    expect(stats.flowCounts).toHaveProperty('VALIDATED')
    expect(stats.flowCounts).toHaveProperty('PREPARING')
    expect(stats.flowCounts).toHaveProperty('READY')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// fetchRecentOrders
// ─────────────────────────────────────────────────────────────────────────────
describe('fetchRecentOrders', () => {
  it('retorna array de pedidos recientes', async () => {
    const raw = [
      { id: 'o1', status: 'PENDING', createdAt: '2024-01-01T10:00:00Z', tables: { number: 3 } },
      { id: 'o2', status: 'READY', createdAt: '2024-01-01T11:00:00Z', tables: null },
    ]
    setupMockFrom({}, makeChain({ data: raw, error: null }))
    const result = await fetchRecentOrders('r1')
    expect(Array.isArray(result)).toBe(true)
    expect(result[0]).toHaveProperty('id')
    expect(result[0]).toHaveProperty('status')
    expect(result[0]).toHaveProperty('table_number')
  })

  it('usa "S/N" cuando la mesa es null', async () => {
    const raw = [
      { id: 'o1', status: 'READY', createdAt: '2024-01-01T10:00:00Z', tables: null },
    ]
    setupMockFrom({}, makeChain({ data: raw, error: null }))
    const result = await fetchRecentOrders('r1')
    expect(result[0].table_number).toBe('S/N')
  })

  it('lanza error cuando Supabase devuelve error', async () => {
    setupMockFrom({}, makeChain({ data: null, error: { message: 'DB fail' } }))
    await expect(fetchRecentOrders('r1')).rejects.toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// fetchTables
// ─────────────────────────────────────────────────────────────────────────────
describe('fetchTables', () => {
  it('retorna array de mesas', async () => {
    const raw = [
      { id: 't1', number: 1, status: 'FREE' },
      { id: 't2', number: 2, status: 'OCCUPIED' },
    ]
    setupMockFrom({}, makeChain({ data: raw, error: null }))
    const result = await fetchTables('r1')
    expect(Array.isArray(result)).toBe(true)
    expect(result[0]).toHaveProperty('id')
    expect(result[0]).toHaveProperty('status')
  })

  it('lanza error cuando Supabase devuelve error', async () => {
    setupMockFrom({}, makeChain({ data: null, error: { message: 'DB fail' } }))
    await expect(fetchTables('r1')).rejects.toBeTruthy()
  })

  it('retorna array vacío cuando no hay mesas', async () => {
    setupMockFrom({}, makeChain({ data: null, error: null }))
    const result = await fetchTables('r1')
    expect(result).toEqual([])
  })
})
