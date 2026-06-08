// @vitest-environment jsdom
/**
 * Tests de hooks de cliente de local-dashboard: useOrders, useCategories, useProfile,
 * useLocalDashboard. Mockean fetch y los módulos compartidos (@menu-bites/auth, store).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const h = vi.hoisted(() => {
  const removeChannel = vi.fn()
  const subscribe = vi.fn(() => ({}))
  const channelOn = vi.fn(() => ({ subscribe }))
  const channel = vi.fn(() => ({ on: channelOn }))
  const realtime = {
    orders: [] as any[],
    ordersLoading: false,
    stats: null as any,
    statsLoading: false,
    tables: [] as any[],
    tablesLoading: false,
  }
  const authUser = { value: { restaurantId: 'r1', email: 'a@r.com' } as any }
  return { removeChannel, subscribe, channelOn, channel, realtime, authUser }
})

vi.mock('@menu-bites/auth', () => ({
  supabase: { channel: h.channel, removeChannel: h.removeChannel },
  STALE_ORDER_MINUTES: 15,
  useRealtimeOrders: () => ({ orders: h.realtime.orders, loading: h.realtime.ordersLoading }),
  useRealtimeStats: () => ({ stats: h.realtime.stats, loading: h.realtime.statsLoading }),
  useTables: () => ({ tables: h.realtime.tables, loading: h.realtime.tablesLoading }),
}))
vi.mock('@menu-bites/store', () => ({ useAuthStore: () => ({ user: h.authUser.value }) }))

import { useOrders } from '../hooks/useOrders'
import { useCategories } from '../hooks/useCategories'
import { useProfile } from '../hooks/useProfile'
import { useLocalDashboard } from '../hooks/useLocalDashboard'

function mockFetch(responses: Array<{ ok: boolean; body: any }>) {
  const fn = vi.fn()
  responses.forEach((r) => fn.mockResolvedValueOnce({ ok: r.ok, json: async () => r.body } as any))
  fn.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) } as any)
  vi.stubGlobal('fetch', fn)
  return fn
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
  h.realtime.orders = []
  h.realtime.ordersLoading = false
  h.realtime.stats = null
  h.realtime.statsLoading = false
  h.realtime.tables = []
  h.realtime.tablesLoading = false
  h.authUser.value = { restaurantId: 'r1', email: 'a@r.com' }
})

// ─── useOrders ───────────────────────────────────────────────────────────────
describe('useOrders', () => {
  it('carga órdenes y se suscribe a Realtime', async () => {
    mockFetch([{ ok: true, body: { data: [{ id: 'o1', status: 'PENDING' }] } }])
    const { result } = renderHook(() => useOrders())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.orders).toHaveLength(1)
    expect(h.channel).toHaveBeenCalledWith('orders_changes')
  })

  it('filteredOrders filtra por estado', async () => {
    mockFetch([
      { ok: true, body: { data: [{ id: 'o1', status: 'PENDING' }, { id: 'o2', status: 'READY' }] } },
    ])
    const { result } = renderHook(() => useOrders())
    await waitFor(() => expect(result.current.orders).toHaveLength(2))
    act(() => result.current.setFilterStatus('READY'))
    expect(result.current.filteredOrders).toEqual([{ id: 'o2', status: 'READY' }])
  })

  it('setea error cuando el fetch falla', async () => {
    mockFetch([{ ok: false, body: { error: 'boom' } }])
    const { result } = renderHook(() => useOrders())
    await waitFor(() => expect(result.current.error).toBe('boom'))
  })

  it('handleStatusChange hace PUT al endpoint correcto', async () => {
    const fetchFn = mockFetch([{ ok: true, body: { data: [] } }])
    const { result } = renderHook(() => useOrders())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.handleStatusChange('o1', 'VALIDATED' as any)
    })
    const putCall = fetchFn.mock.calls.find((c) => String(c[0]).includes('/api/local/orders/o1'))
    expect(putCall).toBeTruthy()
    expect(putCall![1]).toMatchObject({ method: 'PUT' })
  })

  it('remueve el canal al desmontar', async () => {
    mockFetch([{ ok: true, body: { data: [] } }])
    const { unmount } = renderHook(() => useOrders())
    unmount()
    expect(h.removeChannel).toHaveBeenCalled()
  })
})

// ─── useCategories ───────────────────────────────────────────────────────────
describe('useCategories', () => {
  it('carga categorías al montar', async () => {
    mockFetch([{ ok: true, body: { data: [{ id: 'c1', name: 'Bebidas' }] } }])
    const { result } = renderHook(() => useCategories())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.categories).toHaveLength(1)
  })

  it('openCreate resetea el formulario y abre el modal', async () => {
    mockFetch([{ ok: true, body: { data: [] } }])
    const { result } = renderHook(() => useCategories())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => result.current.openCreate())
    expect(result.current.isModalOpen).toBe(true)
    expect(result.current.editingCat).toBeNull()
    expect(result.current.form.name).toBe('')
  })

  it('openEdit carga los datos de la categoría', async () => {
    mockFetch([{ ok: true, body: { data: [] } }])
    const { result } = renderHook(() => useCategories())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() =>
      result.current.openEdit({ id: 'c1', name: 'Postres', is_active: true, target_station: 'KITCHEN' } as any),
    )
    expect(result.current.editingCat?.id).toBe('c1')
    expect(result.current.form.name).toBe('Postres')
  })

  it('handleSave crea (POST) cuando no hay categoría en edición', async () => {
    const fetchFn = mockFetch([{ ok: true, body: { data: [] } }])
    const { result } = renderHook(() => useCategories())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => result.current.setForm({ name: 'Nueva', is_active: true, target_station: 'BAR' }))
    await act(async () => {
      await result.current.handleSave()
    })
    const post = fetchFn.mock.calls.find((c) => c[0] === '/api/local/categories' && c[1]?.method === 'POST')
    expect(post).toBeTruthy()
    expect(result.current.isModalOpen).toBe(false)
  })

  it('handleSave no hace nada si el nombre está vacío', async () => {
    const fetchFn = mockFetch([{ ok: true, body: { data: [] } }])
    const { result } = renderHook(() => useCategories())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const before = fetchFn.mock.calls.length
    await act(async () => {
      await result.current.handleSave()
    })
    expect(fetchFn.mock.calls.length).toBe(before)
  })

  it('deleteCategory pide confirmación y borra (DELETE)', async () => {
    const fetchFn = mockFetch([{ ok: true, body: { data: [] } }])
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { result } = renderHook(() => useCategories())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.deleteCategory('c1')
    })
    const del = fetchFn.mock.calls.find((c) => String(c[0]).includes('/categories/c1') && c[1]?.method === 'DELETE')
    expect(del).toBeTruthy()
  })

  it('deleteCategory se cancela si el usuario no confirma', async () => {
    const fetchFn = mockFetch([{ ok: true, body: { data: [] } }])
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { result } = renderHook(() => useCategories())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const before = fetchFn.mock.calls.length
    await act(async () => {
      await result.current.deleteCategory('c1')
    })
    expect(fetchFn.mock.calls.length).toBe(before)
  })
})

// ─── useProfile ──────────────────────────────────────────────────────────────
describe('useProfile', () => {
  it('rechaza guardar si no hay cambios', async () => {
    mockFetch([])
    const { result } = renderHook(() => useProfile())
    let ok: any
    await act(async () => {
      ok = await result.current.handleSave()
    })
    expect(ok).toBe(false)
    expect(result.current.message?.type).toBe('error')
  })

  it('guarda nombre y contraseña (PUT) y limpia password', async () => {
    const fetchFn = mockFetch([{ ok: true, body: {} }])
    const { result } = renderHook(() => useProfile())
    act(() => {
      result.current.setName('Nuevo')
      result.current.setPassword('secret123')
    })
    let ok: any
    await act(async () => {
      ok = await result.current.handleSave()
    })
    expect(ok).toBe(true)
    expect(fetchFn).toHaveBeenCalledWith('/api/local/profile', expect.objectContaining({ method: 'PUT' }))
    expect(result.current.message?.type).toBe('success')
    expect(result.current.password).toBe('')
  })

  it('propaga error del servidor', async () => {
    mockFetch([{ ok: false, body: { error: 'no permitido' } }])
    const { result } = renderHook(() => useProfile())
    act(() => result.current.setName('X'))
    await act(async () => {
      await result.current.handleSave()
    })
    expect(result.current.message).toEqual({ type: 'error', text: 'no permitido' })
  })
})

// ─── useLocalDashboard ───────────────────────────────────────────────────────
describe('useLocalDashboard', () => {
  it('compone loading de los tres hooks de Realtime', () => {
    h.realtime.tablesLoading = true
    const { result } = renderHook(() => useLocalDashboard())
    expect(result.current.loading).toBe(true)
  })

  it('cuenta solo las órdenes activas', () => {
    h.realtime.orders = [{ status: 'PENDING' }, { status: 'READY' }, { status: 'COMPLETED' }, { status: 'REJECTED' }]
    const { result } = renderHook(() => useLocalDashboard())
    expect(result.current.activeOrdersCount).toBe(2)
    expect(result.current.staleMinutes).toBe(15)
    expect(result.current.restaurantId).toBe('r1')
  })
})
