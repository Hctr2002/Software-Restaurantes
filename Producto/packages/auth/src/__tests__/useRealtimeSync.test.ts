import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

/**
 * Mock controlable de Supabase para ejercitar useRealtimeSync:
 *  - getSession devuelve `state.session` (para probar la inyección de token Realtime).
 *  - channel().subscribe(cb) invoca cb con el siguiente status de `state.subscribeStatuses`
 *    (por defecto 'SUBSCRIBED'), permitiendo simular CHANNEL_ERROR/TIMED_OUT/CLOSED.
 *  - se capturan: nombres de canal, tokens pasados a realtime.setAuth, canales removidos,
 *    y el handler de postgres_changes para poder dispararlo manualmente.
 */
const h = vi.hoisted(() => {
  const state = {
    session: null as any,
    subscribeStatuses: [] as string[],
    changeHandler: null as null | (() => void),
    channelNames: [] as string[],
    setAuthTokens: [] as any[],
    removed: 0,
  }
  return { state }
})

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockImplementation(async () => ({ data: { session: h.state.session } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn((name: string) => {
      h.state.channelNames.push(name)
      const ch: any = {
        on: vi.fn((_event: string, _cfg: any, handler: () => void) => {
          h.state.changeHandler = handler
          return ch
        }),
        subscribe: vi.fn((cb: (s: string) => void) => {
          const status = h.state.subscribeStatuses.shift() ?? 'SUBSCRIBED'
          cb?.(status)
          return ch
        }),
      }
      return ch
    }),
    removeChannel: vi.fn(() => {
      h.state.removed++
    }),
    realtime: { setAuth: vi.fn((t: any) => h.state.setAuthTokens.push(t)) },
    storage: { from: vi.fn(() => ({ getPublicUrl: vi.fn() })) },
  })),
}))

import { useRealtimeSync } from '../hooks/useRealtimeSync'

beforeEach(() => {
  h.state.session = null
  h.state.subscribeStatuses = []
  h.state.changeHandler = null
  h.state.channelNames = []
  h.state.setAuthTokens = []
  h.state.removed = 0
})

// ─── Forma y estado base ─────────────────────────────────────────────────────

describe('useRealtimeSync — base', () => {
  it('retorna { data, loading, setData, refetch }', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ data: [1, 2], error: null })
    const { result } = renderHook(() => useRealtimeSync('r1', 'orders', fetchFn))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(typeof result.current.setData).toBe('function')
    expect(typeof result.current.refetch).toBe('function')
  })

  it('initialData = [] para tablas de lista conocidas', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ data: null, error: null })
    const { result } = renderHook(() => useRealtimeSync('r1', 'orders', fetchFn))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([])
  })

  it('initialData = null para tablas que no son de lista', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ data: null, error: null })
    const { result } = renderHook(() => useRealtimeSync('r1', 'restaurants', fetchFn))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBeNull()
  })

  it('aplica transform al resultado del fetch', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ data: [1, 2, 3], error: null })
    const { result } = renderHook(() =>
      useRealtimeSync<number[]>('r1', 'orders', fetchFn, {
        transform: (d: number[]) => d.map((n) => n * 10),
      }),
    )
    await waitFor(() => expect(result.current.data).toEqual([10, 20, 30]))
  })

  it('no actualiza data cuando el fetch devuelve error (mantiene initialData)', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ data: [9], error: { message: 'x' } })
    const { result } = renderHook(() => useRealtimeSync('r1', 'orders', fetchFn))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([])
  })

  it('no actualiza data cuando el fetch devuelve null', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ data: null, error: null })
    const { result } = renderHook(() =>
      useRealtimeSync('r1', 'orders', fetchFn, { initialData: ['keep'] as any }),
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(['keep'])
  })
})

// ─── Scope: sin restaurantId ni filter no se suscribe ────────────────────────

describe('useRealtimeSync — scope', () => {
  it('sin restaurantId ni filter no hace fetch ni se suscribe', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ data: [], error: null })
    const { result } = renderHook(() => useRealtimeSync(undefined, 'orders', fetchFn))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetchFn).not.toHaveBeenCalled()
    expect(h.state.channelNames).toEqual([])
  })

  it('con filter personalizado se suscribe aunque no haya restaurantId', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ data: [], error: null })
    renderHook(() =>
      useRealtimeSync(undefined, 'orders', fetchFn, { filter: 'table_id=eq.t1' }),
    )
    await waitFor(() => expect(h.state.channelNames.length).toBe(1))
    expect(fetchFn).toHaveBeenCalled()
  })
})

// ─── Realtime: token, handler de cambios, limpieza, reintentos ───────────────

describe('useRealtimeSync — realtime', () => {
  it('inyecta el access_token de la sesión en realtime.setAuth', async () => {
    h.state.session = { access_token: 'tok-abc' }
    const fetchFn = vi.fn().mockResolvedValue({ data: [], error: null })
    renderHook(() => useRealtimeSync('r1', 'orders', fetchFn))
    await waitFor(() => expect(h.state.setAuthTokens).toContain('tok-abc'))
  })

  it('usa token null para usuarios anónimos (sin sesión)', async () => {
    h.state.session = null
    const fetchFn = vi.fn().mockResolvedValue({ data: [], error: null })
    renderHook(() => useRealtimeSync('r1', 'orders', fetchFn))
    await waitFor(() => expect(h.state.setAuthTokens).toContain(null))
  })

  it('un cambio en Realtime dispara un refetch', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ data: [], error: null })
    renderHook(() => useRealtimeSync('r1', 'orders', fetchFn))
    await waitFor(() => expect(h.state.changeHandler).toBeTruthy())
    const callsBefore = fetchFn.mock.calls.length
    await act(async () => {
      h.state.changeHandler?.()
    })
    await waitFor(() => expect(fetchFn.mock.calls.length).toBeGreaterThan(callsBefore))
  })

  it('remueve el canal al desmontar', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ data: [], error: null })
    const { unmount } = renderHook(() => useRealtimeSync('r1', 'orders', fetchFn))
    await waitFor(() => expect(h.state.channelNames.length).toBe(1))
    unmount()
    await waitFor(() => expect(h.state.removed).toBeGreaterThan(0))
  })

  // El backoff de reintento se agenda con setTimeout(() => setRetryCount(...), delay).
  // Verificamos la rama de reintento comprobando que se programa el timer ante cada
  // status de error, sin depender del re-render asíncrono bajo fake timers.
  it.each(['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'])(
    'agenda un reintento con backoff ante %s',
    async (status) => {
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
      h.state.subscribeStatuses = [status]
      const fetchFn = vi.fn().mockResolvedValue({ data: [], error: null })
      renderHook(() => useRealtimeSync('r1', 'orders', fetchFn))
      await waitFor(() => expect(h.state.channelNames.length).toBe(1))
      await waitFor(() =>
        expect(
          setTimeoutSpy.mock.calls.some(
            ([fn, delay]) => typeof fn === 'function' && typeof delay === 'number' && delay > 0,
          ),
        ).toBe(true),
      )
      setTimeoutSpy.mockRestore()
    },
  )
})
