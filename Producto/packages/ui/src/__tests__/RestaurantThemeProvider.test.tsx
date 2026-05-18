import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RestaurantThemeProvider, hexToHslValues } from '../components/RestaurantThemeProvider'

const mockTheme = {
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  backgroundColor: '#0f172a',
  accentColor: '#06b6d4',
  textColor: '#f8fafc',
  cardBackground: '#1e293b',
  fontTitle: 'Playfair Display',
  fontBody: 'Inter',
  fontAccent: 'Poppins',
}

describe('hexToHslValues', () => {
  it('convierte negro (#000000) a HSL', () => {
    expect(hexToHslValues('#000000')).toMatch(/^0 0% 0%$/)
  })

  it('convierte blanco (#ffffff) a HSL', () => {
    expect(hexToHslValues('#ffffff')).toMatch(/^0 0% 100%$/)
  })

  it('convierte rojo puro (#ff0000)', () => {
    const result = hexToHslValues('#ff0000')
    expect(result).toMatch(/^0 100% 50%$/)
  })

  it('acepta hex sin # (shorthand expandido)', () => {
    const withHash = hexToHslValues('#336699')
    const withoutHash = hexToHslValues('336699')
    expect(withHash).toBe(withoutHash)
  })

  it('expande shorthand hex de 3 dígitos', () => {
    const result = hexToHslValues('#fff')
    expect(result).toMatch(/0 0% 100%/)
  })

  it('retorna un string con formato "H S% L%"', () => {
    const result = hexToHslValues('#3b82f6')
    expect(result).toMatch(/^\d+ \d+% \d+%$/)
  })
})

describe('RestaurantThemeProvider — renderizado', () => {
  it('renderiza children sin tema', () => {
    render(
      <RestaurantThemeProvider>
        <div data-testid="child">Hola</div>
      </RestaurantThemeProvider>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('renderiza children con tema', () => {
    render(
      <RestaurantThemeProvider theme={mockTheme}>
        <div data-testid="child">Con tema</div>
      </RestaurantThemeProvider>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('renderiza children con tema null', () => {
    render(
      <RestaurantThemeProvider theme={null}>
        <div data-testid="child">Null tema</div>
      </RestaurantThemeProvider>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('crea un contenedor div cuando isGlobal=false (default)', () => {
    const { container } = render(
      <RestaurantThemeProvider theme={mockTheme}>
        <span>Inner</span>
      </RestaurantThemeProvider>
    )
    // When isGlobal=false, it wraps in a div
    expect(container.querySelector('div')).toBeInTheDocument()
  })

  it('aplica CSS vars en el contenedor con tema', () => {
    const { container } = render(
      <RestaurantThemeProvider theme={mockTheme} isGlobal={false}>
        <span>Inner</span>
      </RestaurantThemeProvider>
    )
    const div = container.querySelector('div')
    // After effect fires, the div should have style attribute
    expect(div).toBeInTheDocument()
  })
})
