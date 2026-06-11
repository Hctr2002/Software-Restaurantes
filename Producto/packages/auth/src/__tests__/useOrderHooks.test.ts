import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

/**
 * Resultado configurable que devuelve la query mockeada de `orders`.
 * Cada test lo reasigna antes de renderizar el hook.
 */
let ordersResult: { data: any; error: any } = { data: [], error: null }

/**
 * Cadena thenable que imita el query builder de Supabase: cada método
 * encadenable devuelve la misma cadena, y `await chain` resuelve a `ordersResult`.
 * Así `useRealtimeSync.performFetch` recibe `{ data, error }` tras await.
 */
function makeThenable(getResult: () => any) {
  const chain: any = {}
  ;['select', 'eq', 'neq', 'not', 'order', 'in', 'or', 'limit', 'filter', 'gte', 'lte'].forEach(
    (m) => {
      chain[m] = vi.fn(() => chain)
    },
  )
  chain.single = vi.fn(() => Promise.resolve(getResult()))
  chain.then = (resolve: any, reject: any) => Promise.resolve(getResult()).then(resolve, reject)
  chain.catch = (reject: any) => Promise.resolve(getResult()).catch(reject)
  return chain
}

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: vi.fn(() => makeThenable(() => ordersResult)),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((cb) => {
        cb?.('SUBSCRIBED')
        return {}
      }),
    })),
    removeChannel: vi.fn(),
    realtime: { setAuth: vi.fn() },
    storage: { from: vi.fn(() => ({ getPublicUrl: vi.fn() })) },
  })),
}))

import {
  useRealtimeOrders,
  useKitchenOrders,
  useBarOrders,
  useRealtimeStats,
} from '../hooks/useOrderHooks'

// ─── Fixtures ───────────────────────────────────────────────────────────────

/** Pedido "nuevo" con station explícita (modelo actual). */
function newOrder(station: 'KITCHEN' | 'BAR', id = `o-${station}`) {
  return {
    id,
    restaurant_id: 'r1',
    station,
    status: 'PREPARING',
    total_amount: '2000',
    created_at: '2026-06-01T10:00:00Z',
    order_items: [
      {
        id: `${id}-i1`,
        unit_price: '2000',
        quantity: 1,
        menu_items: { name: 'X', category: { target_station: station } },
      },
    ],
  }
}

/** Pedido legacy (station IS NULL) con ítems de cocina y de barra mezclados. */
function legacyMixedOrder() {
  return {
    id: 'o-legacy',
    restaurant_id: 'r1',
    station: null,
    status: 'VALIDATED',
    total_amount: '1000',
    created_at: '2026-06-01T11:00:00Z',
    order_items: [
      {
        id: 'leg-i1',
        unit_price: '500',
        quantity: 1,
        menu_items: { name: 'Papas', category: { target_station: 'KITCHEN' } },
      },
      {
        id: 'leg-i2',
        unit_price: '500',
        quantity: 1,
        menu_items: { name: 'Cerveza', category: { target_station: 'BAR' } },
      },
    ],
  }
}

beforeEach(() => {
  ordersResult = { data: [], error: null }
})

// ─── useRealtimeOrders: forma y carga ────────────────────────────────────────

describe('useRealtimeOrders', () => {
  it('retorna { orders, loading, refetch }', async () => {
    const { result } = renderHook(() => useRealtimeOrders('r1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(Array.isArray(result.current.orders)).toBe(true)
    expect(typeof result.current.refetch).toBe('function')
  })

  it('retorna array vacío y no carga sin restaurantId', async () => {
    const { result } = renderHook(() => useRealtimeOrders(undefined))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.orders).toEqual([])
  })

  it('mapea filas snake_case a camelCase vía mapOrder', async () => {
    ordersResult = { data: [newOrder('KITCHEN')], error: null }
    const { result } = renderHook(() => useRealtimeOrders('r1'))
    await waitFor(() => expect(result.current.orders.length).toBe(1))
    const order = result.current.orders[0] as any
    expect(order.restaurantId).toBe('r1')
    expect(order.totalAmount).toBe(2000)
    expect(typeof order.totalAmount).toBe('number')
    expect(order.orderItems[0].menuItem.category.targetStation).toBe('KITCHEN')
  })

  it('sin filtro de estación incluye todos los pedidos', async () => {
    ordersResult = { data: [newOrder('KITCHEN'), newOrder('BAR')], error: null }
    const { result } = renderHook(() => useRealtimeOrders('r1'))
    await waitFor(() => expect(result.current.orders.length).toBe(2))
  })

  it('devuelve [] cuando el fetch trae error', async () => {
    ordersResult = { data: null, error: { message: 'boom' } }
    const { result } = renderHook(() => useRealtimeOrders('r1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.orders).toEqual([])
  })
})

// ─── Filtrado por estación (lógica de negocio central) ───────────────────────

describe('useRealtimeOrders — filtrado por estación', () => {
  it('incluye solo pedidos con station explícita coincidente', async () => {
    ordersResult = { data: [newOrder('KITCHEN'), newOrder('BAR')], error: null }
    const { result } = renderHook(() =>
      useRealtimeOrders('r1', { station: 'KITCHEN' }),
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.orders.map((o: any) => o.id)).toEqual(['o-KITCHEN'])
  })

  it('excluye pedidos de otra estación', async () => {
    ordersResult = { data: [newOrder('BAR')], error: null }
    const { result } = renderHook(() =>
      useRealtimeOrders('r1', { station: 'KITCHEN' }),
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.orders).toEqual([])
  })

  it('incluye pedido legacy (station null) si tiene ítems de la estación', async () => {
    ordersResult = { data: [legacyMixedOrder()], error: null }
    const { result } = renderHook(() =>
      useRealtimeOrders('r1', { station: 'KITCHEN' }),
    )
    await waitFor(() => expect(result.current.orders.length).toBe(1))
    expect(result.current.orders[0].id).toBe('o-legacy')
  })

  it('en pedido legacy mixto, recorta los ítems a solo los de la estación pedida', async () => {
    ordersResult = { data: [legacyMixedOrder()], error: null }
    const { result } = renderHook(() =>
      useRealtimeOrders('r1', { station: 'KITCHEN' }),
    )
    await waitFor(() => expect(result.current.orders.length).toBe(1))
    const order = result.current.orders[0] as any
    // raw order_items recortados a KITCHEN
    expect(order.order_items).toHaveLength(1)
    expect(order.order_items[0].menu_items.category.target_station).toBe('KITCHEN')
    // orderItems (mapeados) recortados a KITCHEN
    expect(order.orderItems).toHaveLength(1)
    expect(order.orderItems[0].menuItem.category.targetStation).toBe('KITCHEN')
  })

  it('excluye pedido legacy sin ítems de la estación pedida', async () => {
    const onlyBar = legacyMixedOrder()
    onlyBar.order_items = onlyBar.order_items.filter(
      (i) => i.menu_items.category.target_station === 'BAR',
    )
    ordersResult = { data: [onlyBar], error: null }
    const { result } = renderHook(() =>
      useRealtimeOrders('r1', { station: 'KITCHEN' }),
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.orders).toEqual([])
  })
})

// ─── Atajos preconfigurados ──────────────────────────────────────────────────

describe('useKitchenOrders / useBarOrders', () => {
  it('useKitchenOrders filtra a la estación KITCHEN', async () => {
    ordersResult = { data: [newOrder('KITCHEN'), newOrder('BAR')], error: null }
    const { result } = renderHook(() => useKitchenOrders('r1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.orders.map((o: any) => o.id)).toEqual(['o-KITCHEN'])
  })

  it('useBarOrders filtra a la estación BAR', async () => {
    ordersResult = { data: [newOrder('KITCHEN'), newOrder('BAR')], error: null }
    const { result } = renderHook(() => useBarOrders('r1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.orders.map((o: any) => o.id)).toEqual(['o-BAR'])
  })

  it('ambos retornan la forma { orders, loading, refetch }', async () => {
    const kitchen = renderHook(() => useKitchenOrders('r1'))
    const bar = renderHook(() => useBarOrders('r1'))
    await waitFor(() => expect(kitchen.result.current.loading).toBe(false))
    await waitFor(() => expect(bar.result.current.loading).toBe(false))
    expect(typeof kitchen.result.current.refetch).toBe('function')
    expect(typeof bar.result.current.refetch).toBe('function')
  })
})

// ─── useRealtimeStats ────────────────────────────────────────────────────────

describe('useRealtimeStats', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('expone los datos cuando /api/local/stats responde 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: { revenue: 12345, orders: 7 } }),
      }),
    )
    const { result } = renderHook(() => useRealtimeStats('r1'))
    await waitFor(() => expect((result.current.stats as any)?.revenue).toBe(12345))
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/local/stats', { cache: 'no-store' })
  })

  it('no llama a fetch sin restaurantId', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const { result } = renderHook(() => useRealtimeStats(undefined))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('no propaga datos cuando el endpoint responde 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    )
    const { result } = renderHook(() => useRealtimeStats('r1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    // ante error, performFetch no llama setData → permanece en initialData ([] para 'orders')
    expect((result.current.stats as any)?.revenue).toBeUndefined()
  })

  it('tolera 401 transitorio sin lanzar error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) }),
    )
    const { result } = renderHook(() => useRealtimeStats('r1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect((result.current.stats as any)?.revenue).toBeUndefined()
  })
})
