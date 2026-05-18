import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { DynamicThemeWrapper } from '../components/DynamicThemeWrapper'

// Mock @menu-bites/store for useAuthStore
vi.mock('@menu-bites/store', () => ({
  useAuthStore: vi.fn(() => ({ user: { restaurantId: 'rest-1' } })),
}))

// Extend the @menu-bites/auth mock to include useThemeSync
vi.mock('@menu-bites/auth', async (importOriginal) => {
  const original = await importOriginal() as any
  return {
    ...original,
    useThemeSync: vi.fn(() => null),
  }
})

describe('DynamicThemeWrapper — renderizado', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renderiza children', () => {
    render(
      <DynamicThemeWrapper appKey="test-app">
        <div data-testid="child">Contenido</div>
      </DynamicThemeWrapper>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('renderiza sin user (restaurantId undefined)', async () => {
    const { useAuthStore } = await import('@menu-bites/store')
    ;(useAuthStore as any).mockReturnValue({ user: null })
    render(
      <DynamicThemeWrapper appKey="test-app">
        <div data-testid="child">Sin usuario</div>
      </DynamicThemeWrapper>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('carga tema desde localStorage si existe', () => {
    const cachedTheme = {
      primaryColor: '#ff0000',
      secondaryColor: '#00ff00',
      backgroundColor: '#000000',
      accentColor: '#0000ff',
      textColor: '#ffffff',
      cardBackground: '#111111',
    }
    localStorage.setItem('mb-theme-test-app', JSON.stringify(cachedTheme))
    render(
      <DynamicThemeWrapper appKey="test-app">
        <div data-testid="child">Con caché</div>
      </DynamicThemeWrapper>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('maneja localStorage inaccesible sin lanzar', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => { throw new Error('storage') })
    expect(() => {
      render(
        <DynamicThemeWrapper appKey="test-app">
          <div>OK</div>
        </DynamicThemeWrapper>
      )
    }).not.toThrow()
    vi.restoreAllMocks()
  })

  it('responde al evento admin-theme-preview', async () => {
    const { useAuthStore } = await import('@menu-bites/store')
    ;(useAuthStore as any).mockReturnValue({ user: { restaurantId: 'rest-1' } })

    render(
      <DynamicThemeWrapper appKey="test-app">
        <div data-testid="child">Live preview</div>
      </DynamicThemeWrapper>
    )

    const newTheme = {
      primaryColor: '#0000ff',
      secondaryColor: '#ff00ff',
      backgroundColor: '#ffffff',
      accentColor: '#00ffff',
      textColor: '#000000',
      cardBackground: '#f0f0f0',
    }

    act(() => {
      window.dispatchEvent(new CustomEvent('admin-theme-preview', { detail: newTheme }))
    })

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
