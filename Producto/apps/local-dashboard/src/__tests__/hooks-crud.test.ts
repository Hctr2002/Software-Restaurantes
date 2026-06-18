// @vitest-environment jsdom
/**
 * Tests de los hooks CRUD de local-dashboard: useTables, useUsers, useMenu, useInventory,
 * useAlerts, useReportsData. Mockean fetch, @menu-bites/auth (supabase/storage) y @menu-bites/ui.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const h = vi.hoisted(() => {
  const removeChannel = vi.fn()
  const subscribe = vi.fn(() => ({}))
  const channel = vi.fn(() => ({ on: vi.fn(() => ({ subscribe })) }))
  const upload = vi.fn(async () => ({ error: null }))
  const getPublicUrl = vi.fn(() => ({ data: { publicUrl: 'http://img/x.jpg' } }))
  const storageFrom = vi.fn(() => ({ upload, getPublicUrl }))
  return { removeChannel, subscribe, channel, upload, getPublicUrl, storageFrom }
})

vi.mock('@menu-bites/auth', () => ({
  supabase: { channel: h.channel, removeChannel: h.removeChannel, storage: { from: h.storageFrom } },
  getSession: async () => ({}),
  getAppMetadata: () => ({ restaurant_id: 'r1' }),
}))
vi.mock('@menu-bites/ui', () => ({}))

import { useTables } from '../hooks/useTables'
import { useUsers } from '../hooks/useUsers'
import { useMenu } from '../hooks/useMenu'
import { useInventory } from '../hooks/useInventory'
import { useAlerts } from '../hooks/useAlerts'
import { useReportsData } from '../hooks/useReportsData'

function mockFetch(map: (url: string, init?: any) => { ok: boolean; body: any }) {
  const fn = vi.fn(async (url: string, init?: any) => {
    const r = map(String(url), init)
    return { ok: r.ok, json: async () => r.body } as any
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
  // jsdom no implementa createObjectURL
  ;(globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:x')
  ;(globalThis as any).URL.revokeObjectURL = vi.fn()
})

// ─── useTables ───────────────────────────────────────────────────────────────
describe('useTables', () => {
  it('carga mesas y crea (POST) una nueva', async () => {
    const fetchFn = mockFetch((url) =>
      url.includes('/api/local/tables') ? { ok: true, body: { data: [{ id: 't1', number: 1 }] } } : { ok: true, body: {} },
    )
    const { result } = renderHook(() => useTables())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tables).toHaveLength(1)

    act(() => result.current.setForm({ number: '5', label: 'A', status: 'FREE' }))
    await act(async () => {
      await result.current.handleSave()
    })
    const post = fetchFn.mock.calls.find((c) => c[0] === '/api/local/tables' && c[1]?.method === 'POST')
    expect(post).toBeTruthy()
    expect(JSON.parse(post![1].body)).toMatchObject({ number: 5, label: 'A' })
  })

  it('handleSave no hace nada sin número', async () => {
    const fetchFn = mockFetch(() => ({ ok: true, body: { data: [] } }))
    const { result } = renderHook(() => useTables())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const before = fetchFn.mock.calls.length
    await act(async () => {
      await result.current.handleSave()
    })
    expect(fetchFn.mock.calls.length).toBe(before)
  })

  it('deleteTable confirma y borra', async () => {
    const fetchFn = mockFetch(() => ({ ok: true, body: { data: [] } }))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { result } = renderHook(() => useTables())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.deleteTable('t1')
    })
    expect(fetchFn.mock.calls.some((c) => String(c[0]).includes('/tables/t1') && c[1]?.method === 'DELETE')).toBe(true)
  })
})

// ─── useUsers ────────────────────────────────────────────────────────────────
describe('useUsers', () => {
  it('carga usuarios', async () => {
    mockFetch(() => ({ ok: true, body: { data: [{ id: 'u1', email: 'a@r.com', role: 'GARZON' }] } }))
    const { result } = renderHook(() => useUsers())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.users).toHaveLength(1)
  })

  it('saveUser exige contraseña al crear', async () => {
    mockFetch(() => ({ ok: true, body: { data: [] } }))
    const { result } = renderHook(() => useUsers())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => result.current.setForm({ email: 'n@r.com', password: '', role: 'GARZON' }))
    await expect(
      act(async () => {
        await result.current.saveUser()
      }),
    ).rejects.toThrow(/contraseña/i)
  })

  it('saveUser crea con POST cuando hay datos válidos', async () => {
    const fetchFn = mockFetch(() => ({ ok: true, body: { data: {} } }))
    const { result } = renderHook(() => useUsers())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => result.current.setForm({ email: 'n@r.com', password: 'secret123', role: 'COCINA' }))
    await act(async () => {
      await result.current.saveUser()
    })
    expect(fetchFn.mock.calls.some((c) => c[0] === '/api/local/users' && c[1]?.method === 'POST')).toBe(true)
  })
})

// ─── useMenu ─────────────────────────────────────────────────────────────────
describe('useMenu', () => {
  it('carga items y categorías al montar', async () => {
    mockFetch((url) =>
      url.includes('/menu')
        ? { ok: true, body: { data: [{ id: 'm1', name: 'Burger' }] } }
        : { ok: true, body: { data: [{ id: 'c1', name: 'Platos' }] } },
    )
    const { result } = renderHook(() => useMenu())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items).toHaveLength(1)
    await waitFor(() => expect(result.current.categories).toHaveLength(1))
  })

  it('saveItem lanza error si faltan campos requeridos', async () => {
    mockFetch(() => ({ ok: true, body: { data: [] } }))
    const { result } = renderHook(() => useMenu())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await expect(
      act(async () => {
        await result.current.saveItem(null, null)
      }),
    ).rejects.toThrow(/requeridos/i)
  })

  it('saveItem hace POST usando el preview actual (sin subir imagen)', async () => {
    const fetchFn = mockFetch(() => ({ ok: true, body: { data: {} } }))
    const { result } = renderHook(() => useMenu())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => result.current.setForm({ name: 'Pizza', description: '', price: '9990', is_active: true, categoryId: 'c1' }))
    await act(async () => {
      await result.current.saveItem(null, 'http://prev/img.jpg')
    })
    const post = fetchFn.mock.calls.find((c) => c[0] === '/api/local/menu' && c[1]?.method === 'POST')
    expect(post).toBeTruthy()
    expect(JSON.parse(post![1].body).image_url).toBe('http://prev/img.jpg')
  })

  it('toggleActive invierte is_active vía PUT', async () => {
    const fetchFn = mockFetch(() => ({ ok: true, body: { data: {} } }))
    const { result } = renderHook(() => useMenu())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.toggleActive({ id: 'm1', name: 'X', price: 1, is_active: true, categoryId: 'c1' } as any)
    })
    const put = fetchFn.mock.calls.find((c) => String(c[0]).includes('/menu/m1') && c[1]?.method === 'PUT')
    expect(JSON.parse(put![1].body).is_active).toBe(false)
  })
})

// ─── useInventory ────────────────────────────────────────────────────────────
describe('useInventory', () => {
  it('saveItem hace POST y refresca', async () => {
    const fetchFn = mockFetch(() => ({ ok: true, body: { data: [] } }))
    const { result } = renderHook(() => useInventory())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => result.current.setForm({ name: 'Sal', stock: '10', unit: 'kg' }))
    let ok: any
    await act(async () => {
      ok = await result.current.saveItem()
    })
    expect(ok).toBe(true)
    expect(fetchFn.mock.calls.some((c) => c[0] === '/api/local/inventory' && c[1]?.method === 'POST')).toBe(true)
  })

  it('handleImportCSV envía el texto y reporta resultado', async () => {
    const fetchFn = mockFetch((url) =>
      url.includes('/import') ? { ok: true, body: { updated: 3, errors: [] } } : { ok: true, body: { data: [] } },
    )
    const { result } = renderHook(() => useInventory())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const file = { text: async () => 'id,stock_actual\n1,5' } as any
    await act(async () => {
      await result.current.handleImportCSV(file)
    })
    expect(fetchFn.mock.calls.some((c) => String(c[0]).includes('/inventory/import'))).toBe(true)
    expect(result.current.importStatus).toBe('success')
    expect(result.current.importMessage).toContain('3')
  })

  it('exportCSV genera un blob descargable', async () => {
    mockFetch(() => ({ ok: true, body: { data: [{ id: 'i1', name: 'Sal', stock: 10, unit: 'kg' }] } }))
    const { result } = renderHook(() => useInventory())
    await waitFor(() => expect(result.current.items).toHaveLength(1))
    act(() => result.current.exportCSV())
    expect((globalThis as any).URL.createObjectURL).toHaveBeenCalled()
  })
})

// ─── useAlerts ───────────────────────────────────────────────────────────────
describe('useAlerts', () => {
  it('carga alertas y se suscribe a Realtime', async () => {
    mockFetch(() => ({ ok: true, body: { data: [{ id: 'a1' }] } }))
    const { result } = renderHook(() => useAlerts())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.alerts).toHaveLength(1)
    expect(h.channel).toHaveBeenCalledWith('alerts-realtime-hook')
  })

  it('resolveAlert hace PUT con la acción dada', async () => {
    const fetchFn = mockFetch(() => ({ ok: true, body: { data: [] } }))
    const { result } = renderHook(() => useAlerts())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.resolveAlert('a1', 'disable_item', 'mi1')
    })
    const put = fetchFn.mock.calls.find((c) => String(c[0]).includes('/alerts/a1') && c[1]?.method === 'PUT')
    expect(JSON.parse(put![1].body)).toMatchObject({ action: 'disable_item', menuItemId: 'mi1' })
  })

  it('dispara el callback onNewAlert cuando aumentan las alertas', async () => {
    let body: any = { data: [] }
    mockFetch(() => ({ ok: true, body }))
    const { result } = renderHook(() => useAlerts())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const cb = vi.fn()
    act(() => result.current.onNewAlert(cb))
    body = { data: [{ id: 'a1' }, { id: 'a2' }] }
    await act(async () => {
      await result.current.refresh()
    })
    expect(cb).toHaveBeenCalled()
  })
})

// ─── useReportsData ──────────────────────────────────────────────────────────
describe('useReportsData', () => {
  const orders = {
    data: [
      {
        status: 'COMPLETED',
        createdAt: '2026-06-01T10:00:00Z',
        order_items: [{ unitPrice: 1000, quantity: 2, menu_items: { name: 'Burger' } }],
        tables: { number: 1 },
        users: { email: 'g@r.com' },
      },
    ],
  }

  it('carga y procesa reportes al montar', async () => {
    mockFetch(() => ({ ok: true, body: orders }))
    const { result } = renderHook(() => useReportsData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.dailyReports.length).toBeGreaterThan(0)
    expect(result.current.topItems[0]).toMatchObject({ name: 'Burger' })
  })

  it('applyPreset(0) activa el modo personalizado sin fetch', async () => {
    const fetchFn = mockFetch(() => ({ ok: true, body: orders }))
    const { result } = renderHook(() => useReportsData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const before = fetchFn.mock.calls.length
    act(() => result.current.applyPreset(0))
    expect(result.current.isCustom).toBe(true)
    expect(fetchFn.mock.calls.length).toBe(before)
  })

  it('applyCustomRange ignora rangos inválidos (from > to)', async () => {
    const fetchFn = mockFetch(() => ({ ok: true, body: orders }))
    const { result } = renderHook(() => useReportsData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => {
      result.current.setIsCustom(true)
      result.current.setDateFrom('2026-06-10')
      result.current.setDateTo('2026-06-01')
    })
    const before = fetchFn.mock.calls.length
    act(() => result.current.applyCustomRange())
    expect(fetchFn.mock.calls.length).toBe(before)
  })
})
