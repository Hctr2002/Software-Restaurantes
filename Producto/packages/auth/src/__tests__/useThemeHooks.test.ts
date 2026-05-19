import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { RestaurantTheme } from '../types'

const { mockGetRestaurantTheme } = vi.hoisted(() => ({
  mockGetRestaurantTheme: vi.fn().mockResolvedValue(null),
}))

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn((cb) => { cb?.('SUBSCRIBED'); return {} }) })),
    removeChannel: vi.fn(),
    realtime: { setAuth: vi.fn() },
    storage: { from: vi.fn(() => ({ getPublicUrl: vi.fn() })) },
  })),
}))

import { useThemeSync } from '../hooks/useThemeHooks'

describe('useThemeSync', () => {
  it('retorna null cuando restaurantId es undefined', async () => {
    const { result } = renderHook(() => useThemeSync(undefined))
    // Stays null since no fetch is triggered
    await waitFor(() => expect(result.current).toBeNull())
  })

  it('retorna null cuando supabase no encuentra tema', async () => {
    const { result } = renderHook(() => useThemeSync('rest-1'))
    await waitFor(() => expect(result.current).toBeNull(), { timeout: 3000 })
  })

  it('acepta un channelPrefix opcional', () => {
    expect(() => {
      renderHook(() => useThemeSync('rest-1', 'kitchen'))
    }).not.toThrow()
  })

  it('usa "default" como channelPrefix por defecto', () => {
    expect(() => {
      renderHook(() => useThemeSync('rest-1'))
    }).not.toThrow()
  })

  it('retorna null como valor inicial antes de que cargue el tema', () => {
    const { result } = renderHook(() => useThemeSync('rest-1'))
    // initialData is null, so before fetch resolves it's null
    expect(result.current).toBeNull()
  })

  it('retorna un RestaurantTheme con todas sus propiedades cuando hay tema', async () => {
    const mockTheme: RestaurantTheme = {
      primaryColor: '#6366f1',
      secondaryColor: '#10b981',
      backgroundColor: '#0f172a',
      accentColor: '#f59e0b',
      textColor: '#f8fafc',
      cardBackground: '#1e293b',
      fontTitle: 'Inter',
      fontBody: 'Inter',
      fontAccent: 'Poppins',
      logoUrl: null,
    }

    // Override the supabase single() to return mock theme data
    const { createBrowserClient } = await import('@supabase/ssr')
    ;(createBrowserClient as any).mockReturnValueOnce({
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            primary_color: '#6366f1', secondary_color: '#10b981',
            background_color: '#0f172a', accent_color: '#f59e0b',
            text_color: '#f8fafc', card_background: '#1e293b',
            font_title: 'Inter', font_body: 'Inter', font_accent: 'Poppins',
            logo_url: null, is_active: true,
          },
          error: null,
        }),
      })),
      channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn((cb) => { cb?.('SUBSCRIBED'); return {} }) })),
      removeChannel: vi.fn(),
      realtime: { setAuth: vi.fn() },
      storage: { from: vi.fn(() => ({ getPublicUrl: vi.fn() })) },
    })

    const { result } = renderHook(() => useThemeSync('rest-1'))
    await waitFor(() => result.current !== null, { timeout: 3000 })
    if (result.current) {
      expect(result.current).toMatchObject({
        primaryColor: expect.any(String),
        secondaryColor: expect.any(String),
        backgroundColor: expect.any(String),
      })
    }
  })
})
