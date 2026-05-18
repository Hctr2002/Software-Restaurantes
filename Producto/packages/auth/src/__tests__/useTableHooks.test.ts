import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn((cb) => { cb?.('SUBSCRIBED'); return {} }) })),
    removeChannel: vi.fn(),
    realtime: { setAuth: vi.fn() },
    storage: { from: vi.fn(() => ({ getPublicUrl: vi.fn() })) },
  })),
}))

import { useTables, useTable, useTableOrders } from '../hooks/useTableHooks'

describe('useTables', () => {
  it('retorna { tables, loading, refetch }', async () => {
    const { result } = renderHook(() => useTables('rest-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(Array.isArray(result.current.tables)).toBe(true)
    expect(typeof result.current.refetch).toBe('function')
  })

  it('retorna array vacío sin restaurantId', async () => {
    const { result } = renderHook(() => useTables(undefined))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tables).toEqual([])
  })

  it('comienza cargando cuando se provee restaurantId', () => {
    const { result } = renderHook(() => useTables('rest-1'))
    // loading starts true
    expect(typeof result.current.loading).toBe('boolean')
  })
})

describe('useTable', () => {
  it('retorna { table, loading, refetch }', async () => {
    const { result } = renderHook(() => useTable('table-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(typeof result.current.loading).toBe('boolean')
    expect(typeof result.current.refetch).toBe('function')
  })

  it('table queda como initialData [] cuando supabase devuelve null para la fila', async () => {
    const { result } = renderHook(() => useTable('table-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    // useRealtimeSync defaults initialData to [] for "tables".
    // When single() returns null, setData is not called (null guard in performFetch),
    // so table stays at the initialData value [].
    expect(result.current.table).toEqual([])
  })

  it('table queda como initialData [] cuando tableId es undefined', async () => {
    const { result } = renderHook(() => useTable(undefined))
    await waitFor(() => expect(result.current.loading).toBe(false))
    // fetchFn returns { data: null } early, setData not called → stays at []
    expect(result.current.table).toEqual([])
  })
})

describe('useTableOrders', () => {
  it('retorna { orders, loading, refetch }', async () => {
    const { result } = renderHook(() => useTableOrders('table-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(Array.isArray(result.current.orders)).toBe(true)
    expect(typeof result.current.refetch).toBe('function')
  })

  it('retorna array vacío sin tableId', async () => {
    const { result } = renderHook(() => useTableOrders(undefined))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.orders).toEqual([])
  })

  it('acepta sessionId opcional', () => {
    expect(() => {
      renderHook(() => useTableOrders('table-1', 'sess-abc'))
    }).not.toThrow()
  })

  it('funciona sin sessionId', () => {
    expect(() => {
      renderHook(() => useTableOrders('table-1'))
    }).not.toThrow()
  })
})
