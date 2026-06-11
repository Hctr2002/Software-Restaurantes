import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

/**
 * Estado compartido del mock de Supabase, definido vía vi.hoisted para que esté
 * disponible dentro de la factory hoisteada de vi.mock.
 *
 * `makeChain` devuelve una cadena thenable que resuelve distinto según la query:
 *  - tabla 'orders' + select('id, status')  → currentOrders (lectura de markDelivered)
 *  - tabla 'orders' + update(...)            → { error: ordersUpdateError }
 *  - tabla 'orders' + limit(...)             → historyOrders (historial del día)
 *  - tabla 'orders' (resto)                  → activeOrders (pedidos activos)
 *  - tabla 'tables'                          → { data: null }
 * Todas las invocaciones se registran en `calls` para poder hacer aserciones.
 */
const h = vi.hoisted(() => {
  const calls: { table: string; method: string; args: any[] }[] = []
  const state: {
    activeOrders: any[]
    historyOrders: any[]
    currentOrders: any[]
    ordersUpdateError: any
  } = { activeOrders: [], historyOrders: [], currentOrders: [], ordersUpdateError: null }

  function makeChain(table: string) {
    const local = { isUpdate: false, selectArg: undefined as any, hasLimit: false }
    const chain: any = {}
    const passthrough =
      (m: string) =>
      (...args: any[]) => {
        calls.push({ table, method: m, args })
        return chain
      }
    chain.select = (arg?: any) => {
      local.selectArg = arg
      calls.push({ table, method: 'select', args: [arg] })
      return chain
    }
    chain.update = (payload: any) => {
      local.isUpdate = true
      calls.push({ table, method: 'update', args: [payload] })
      return chain
    }
    chain.limit = (...args: any[]) => {
      local.hasLimit = true
      calls.push({ table, method: 'limit', args })
      return chain
    }
    ;['insert', 'delete', 'eq', 'neq', 'not', 'in', 'or', 'filter', 'gte', 'lte', 'order'].forEach(
      (m) => {
        chain[m] = passthrough(m)
      },
    )
    const resolve = () => {
      if (table === 'orders') {
        if (local.isUpdate) return { data: null, error: state.ordersUpdateError }
        if (local.selectArg === 'id, status') return { data: state.currentOrders, error: null }
        if (local.hasLimit) return { data: state.historyOrders, error: null }
        return { data: state.activeOrders, error: null }
      }
      return { data: null, error: null }
    }
    chain.single = () => Promise.resolve(resolve())
    chain.then = (res: any, rej: any) => Promise.resolve(resolve()).then(res, rej)
    chain.catch = (rej: any) => Promise.resolve(resolve()).catch(rej)
    return chain
  }

  return { calls, state, makeChain }
})

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: vi.fn((table: string) => h.makeChain(table)),
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

import { useCashierOrders } from '../hooks/useCashierHooks'

function rawOrder(id: string, status: string) {
  return {
    id,
    restaurant_id: 'r1',
    status,
    total_amount: '3000',
    created_at: '2026-06-01T10:00:00Z',
    table: { number: 5 },
    order_items: [{ id: `${id}-i`, unit_price: '3000', quantity: 1, menu_items: { name: 'X' } }],
  }
}

/** Devuelve los validOrderIds que markDelivered pasó al UPDATE de orders. */
function updatedOrderIds() {
  // dentro de markDelivered: read .in('id', orderIds) y luego update().in('id', validOrderIds)
  const idIns = h.calls.filter((c) => c.table === 'orders' && c.method === 'in' && c.args[0] === 'id')
  return idIns.length >= 2 ? idIns[1].args[1] : undefined
}

beforeEach(() => {
  h.calls.length = 0
  h.state.activeOrders = []
  h.state.historyOrders = []
  h.state.currentOrders = []
  h.state.ordersUpdateError = null
})

// ─── Forma y carga inicial ───────────────────────────────────────────────────

describe('useCashierOrders — forma y fetch', () => {
  it('retorna { orders, history, loading, refetch, markDelivered, isProcessing }', async () => {
    const { result } = renderHook(() => useCashierOrders('r1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(Array.isArray(result.current.orders)).toBe(true)
    expect(Array.isArray(result.current.history)).toBe(true)
    expect(typeof result.current.refetch).toBe('function')
    expect(typeof result.current.markDelivered).toBe('function')
    expect(result.current.isProcessing).toBe(false)
  })

  it('no carga ni consulta sin restaurantId', async () => {
    const { result } = renderHook(() => useCashierOrders(undefined))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.orders).toEqual([])
    expect(result.current.history).toEqual([])
  })

  it('mapea pedidos activos e historial a camelCase', async () => {
    h.state.activeOrders = [rawOrder('a1', 'READY')]
    h.state.historyOrders = [rawOrder('h1', 'COMPLETED'), rawOrder('h2', 'COMPLETED')]
    const { result } = renderHook(() => useCashierOrders('r1'))
    await waitFor(() => expect(result.current.orders.length).toBe(1))
    await waitFor(() => expect(result.current.history.length).toBe(2))
    expect((result.current.orders[0] as any).totalAmount).toBe(3000)
    expect((result.current.history[0] as any).restaurantId).toBe('r1')
  })
})

// ─── markDelivered: lógica de cierre de pedidos ──────────────────────────────

describe('useCashierOrders — markDelivered', () => {
  it('marca como COMPLETED solo los pedidos no terminales', async () => {
    h.state.currentOrders = [
      { id: 'a', status: 'DELIVERED' },
      { id: 'b', status: 'COMPLETED' }, // terminal → se omite
      { id: 'c', status: 'REJECTED' }, // terminal → se omite
      { id: 'd', status: 'READY' },
    ]
    const { result } = renderHook(() => useCashierOrders('r1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res: any
    h.calls.length = 0
    await act(async () => {
      res = await result.current.markDelivered(['a', 'b', 'c', 'd'], 't1', 'REF-1')
    })

    expect(res).toEqual({ success: true })
    expect(updatedOrderIds()).toEqual(['a', 'd'])

    const updatePayload = h.calls.find((c) => c.table === 'orders' && c.method === 'update')?.args[0]
    expect(updatePayload.status).toBe('COMPLETED')
    expect(updatePayload.notes).toBe('Ref: REF-1')
  })

  it('usa nota por defecto cuando no hay referencia', async () => {
    h.state.currentOrders = [{ id: 'a', status: 'READY' }]
    const { result } = renderHook(() => useCashierOrders('r1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    h.calls.length = 0
    await act(async () => {
      await result.current.markDelivered(['a'], null, '')
    })
    const updatePayload = h.calls.find((c) => c.table === 'orders' && c.method === 'update')?.args[0]
    expect(updatePayload.notes).toBe('Pagado en Caja')
  })

  it('libera la mesa cuando se pasa tableId', async () => {
    h.state.currentOrders = [{ id: 'a', status: 'READY' }]
    const { result } = renderHook(() => useCashierOrders('r1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    h.calls.length = 0
    await act(async () => {
      await result.current.markDelivered(['a'], 't1', 'REF')
    })
    const tableUpdate = h.calls.find((c) => c.table === 'tables' && c.method === 'update')
    expect(tableUpdate?.args[0]).toMatchObject({ status: 'FREE', bill_requested: false })
  })

  it('no toca la tabla tables cuando tableId es null', async () => {
    h.state.currentOrders = [{ id: 'a', status: 'READY' }]
    const { result } = renderHook(() => useCashierOrders('r1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    h.calls.length = 0
    await act(async () => {
      await result.current.markDelivered(['a'], null, 'REF')
    })
    expect(h.calls.some((c) => c.table === 'tables')).toBe(false)
  })

  it('sale con éxito sin actualizar si todos los pedidos ya son terminales', async () => {
    h.state.currentOrders = [
      { id: 'a', status: 'COMPLETED' },
      { id: 'b', status: 'REJECTED' },
    ]
    const { result } = renderHook(() => useCashierOrders('r1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    h.calls.length = 0
    let res: any
    await act(async () => {
      res = await result.current.markDelivered(['a', 'b'], 't1', 'REF')
    })
    expect(res).toEqual({ success: true })
    expect(h.calls.some((c) => c.table === 'orders' && c.method === 'update')).toBe(false)
    expect(h.calls.some((c) => c.table === 'tables')).toBe(false)
  })

  it('retorna { success: false, error } cuando el update falla', async () => {
    h.state.currentOrders = [{ id: 'a', status: 'READY' }]
    h.state.ordersUpdateError = { message: 'db down' }
    const { result } = renderHook(() => useCashierOrders('r1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res: any
    await act(async () => {
      res = await result.current.markDelivered(['a'], 't1', 'REF')
    })
    expect(res.success).toBe(false)
    expect(res.error).toEqual({ message: 'db down' })
  })
})
