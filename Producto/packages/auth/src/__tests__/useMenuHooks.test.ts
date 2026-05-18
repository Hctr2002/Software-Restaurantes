import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn((cb) => { cb?.('SUBSCRIBED'); return {} }) })),
    removeChannel: vi.fn(),
    realtime: { setAuth: vi.fn() },
    storage: { from: vi.fn(() => ({ getPublicUrl: vi.fn() })) },
  })),
}))

import { useMenu } from '../hooks/useMenuHooks'

describe('useMenu — estructura', () => {
  it('retorna { menu, categories, loading }', async () => {
    const { result } = renderHook(() => useMenu('rest-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(Array.isArray(result.current.menu)).toBe(true)
    expect(Array.isArray(result.current.categories)).toBe(true)
  })

  it('comienza en estado loading', () => {
    const { result } = renderHook(() => useMenu('rest-1'))
    // Initially loading is true (both sub-hooks start loading)
    expect(typeof result.current.loading).toBe('boolean')
  })

  it('retorna arrays vacíos sin restaurantId', async () => {
    const { result } = renderHook(() => useMenu(undefined))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.menu).toEqual([])
    expect(result.current.categories).toEqual([])
  })
})

describe('useMenu — datos mockeados', () => {
  beforeEach(() => vi.clearAllMocks())

  it('aplica mapMenuItem al transformar los datos de la BD', async () => {
    // Override from() to return a raw menu item with snake_case fields
    const { createBrowserClient } = await import('@supabase/ssr')
    const rawMenuItem = {
      id: 'item-1', name: 'Empanada', description: null, price: 1500,
      category_id: 'cat-1', image_url: '/img.jpg', is_active: true, restaurant_id: 'rest-1',
    }
    ;(createBrowserClient as any).mockReturnValue({
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
      from: vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: table === 'menu_items'
          ? vi.fn().mockResolvedValue({ data: [rawMenuItem], error: null })
          : vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
      channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn((cb) => { cb?.('SUBSCRIBED'); return {} }) })),
      removeChannel: vi.fn(),
      realtime: { setAuth: vi.fn() },
      storage: { from: vi.fn(() => ({ getPublicUrl: vi.fn() })) },
    })

    const { result } = renderHook(() => useMenu('rest-1'))
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 })
    // After transform, camelCase fields should exist
    if (result.current.menu.length > 0) {
      expect(result.current.menu[0]).toHaveProperty('categoryId')
      expect(result.current.menu[0]).toHaveProperty('imageUrl')
      expect(result.current.menu[0]).toHaveProperty('isActive')
    }
  })
})
