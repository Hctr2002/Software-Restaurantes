// @vitest-environment jsdom
/**
 * Tests de useBranding — gestión del laboratorio de marca (temas).
 * Mockea next/navigation (useParams) y fetch; usa PALETTE_TEMPLATES y loadGoogleFonts reales.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

vi.mock('next/navigation', () => ({ useParams: () => ({ slug: 'mi-rest' }) }))

import { useBranding } from '../hooks/useBranding'

const ACTIVE_THEME = {
  id: 'th1',
  name: 'Noche',
  is_active: true,
  primary_color: '#111',
  secondary_color: '#222',
  background_color: '#000',
  accent_color: '#f00',
  text_color: '#fff',
  card_background: '#333',
  font_title: 'Inter',
  font_body: 'Roboto',
  palette_name: 'noche',
}

function setupFetch(themes: any[]) {
  const fn = vi.fn(async (url: string, init?: any) => {
    const u = String(url)
    const method = init?.method ?? 'GET'
    if (u.includes('/api/local/theme') && method === 'GET') return { ok: true, json: async () => ({ data: themes }) } as any
    if (u.includes('/api/local/menu')) return { ok: true, json: async () => ({ data: [{ id: 'm1', name: 'Burger' }] }) } as any
    return { ok: true, json: async () => ({}) } as any // PATCH/POST/DELETE
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('useBranding — carga', () => {
  it('carga temas y mapea el tema activo a currentTheme', async () => {
    setupFetch([ACTIVE_THEME])
    const { result } = renderHook(() => useBranding())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.themes).toHaveLength(1)
    expect(result.current.activeTheme?.id).toBe('th1')
    expect(result.current.currentTheme.primaryColor).toBe('#111')
    expect(result.current.originThemeId).toBe('th1')
    expect(result.current.slug).toBe('mi-rest')
  })

  it('carga un producto de ejemplo para el preview', async () => {
    setupFetch([])
    const { result } = renderHook(() => useBranding())
    await waitFor(() => expect(result.current.sampleProduct?.id).toBe('m1'))
  })
})

describe('useBranding — edición', () => {
  it('selectCarouselTheme limpia el origen y no marca dirty', async () => {
    setupFetch([ACTIVE_THEME])
    const { result } = renderHook(() => useBranding())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    act(() => result.current.selectCarouselTheme({ primaryColor: '#abc' }))
    expect(result.current.currentTheme.primaryColor).toBe('#abc')
    expect(result.current.originThemeId).toBeNull()
    expect(result.current.isDirty).toBe(false)
  })

  it('editCurrentTheme marca dirty y dispara evento de preview', async () => {
    setupFetch([ACTIVE_THEME])
    const dispatch = vi.spyOn(window, 'dispatchEvent')
    const { result } = renderHook(() => useBranding())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    act(() => result.current.editCurrentTheme({ primaryColor: '#abc' }))
    expect(result.current.isDirty).toBe(true)
    expect(dispatch).toHaveBeenCalled()
  })
})

describe('useBranding — handleApply', () => {
  it('sin cambios y con tema guardado → activa (PATCH activate)', async () => {
    const fetchFn = setupFetch([ACTIVE_THEME])
    const { result } = renderHook(() => useBranding())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.handleApply()
    })
    const patch = fetchFn.mock.calls.find((c) => c[1]?.method === 'PATCH')
    expect(JSON.parse(patch![1].body)).toMatchObject({ action: 'activate' })
  })

  it('sin cambios y preset de carrusel → guarda directo (POST)', async () => {
    const fetchFn = setupFetch([]) // sin tema activo → originThemeId null
    const { result } = renderHook(() => useBranding())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.handleApply()
    })
    expect(fetchFn.mock.calls.some((c) => c[1]?.method === 'POST')).toBe(true)
  })

  it('con cambios y tema guardado → abre modal update-or-new', async () => {
    setupFetch([ACTIVE_THEME])
    const { result } = renderHook(() => useBranding())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    act(() => result.current.editCurrentTheme({ primaryColor: '#abc' }))
    await act(async () => {
      await result.current.handleApply()
    })
    expect(result.current.saveModalMode).toBe('update-or-new')
  })

  it('con cambios y preset de carrusel → abre modal save-new', async () => {
    setupFetch([])
    const { result } = renderHook(() => useBranding())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    act(() => result.current.editCurrentTheme({ primaryColor: '#abc' }))
    await act(async () => {
      await result.current.handleApply()
    })
    expect(result.current.saveModalMode).toBe('save-new')
  })
})

describe('useBranding — persistencia', () => {
  it('handleUpdateTheme hace PATCH update y retorna true', async () => {
    const fetchFn = setupFetch([ACTIVE_THEME])
    const { result } = renderHook(() => useBranding())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    let ok: any
    await act(async () => {
      ok = await result.current.handleUpdateTheme()
    })
    expect(ok).toBe(true)
    const patch = fetchFn.mock.calls.find((c) => c[1]?.method === 'PATCH' && JSON.parse(c[1].body).action === 'update')
    expect(patch).toBeTruthy()
  })

  it('handleSaveAsNew hace POST y cierra el modal', async () => {
    const fetchFn = setupFetch([ACTIVE_THEME])
    const { result } = renderHook(() => useBranding())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    act(() => result.current.setSaveModalMode('save-new'))
    await act(async () => {
      await result.current.handleSaveAsNew()
    })
    expect(fetchFn.mock.calls.some((c) => c[1]?.method === 'POST')).toBe(true)
    expect(result.current.saveModalMode).toBeNull()
  })

  it('handleDeleteTheme borra por id', async () => {
    const fetchFn = setupFetch([ACTIVE_THEME])
    const { result } = renderHook(() => useBranding())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.handleDeleteTheme('th1')
    })
    expect(fetchFn.mock.calls.some((c) => String(c[0]).includes('themeId=th1') && c[1]?.method === 'DELETE')).toBe(true)
  })

  it('handleDeleteThemes ignora lista vacía', async () => {
    const fetchFn = setupFetch([ACTIVE_THEME])
    const { result } = renderHook(() => useBranding())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const before = fetchFn.mock.calls.length
    let ok: any
    await act(async () => {
      ok = await result.current.handleDeleteThemes([])
    })
    expect(ok).toBe(false)
    expect(fetchFn.mock.calls.length).toBe(before)
  })
})
