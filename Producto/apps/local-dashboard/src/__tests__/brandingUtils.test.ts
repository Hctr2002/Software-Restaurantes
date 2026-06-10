// @vitest-environment jsdom
/**
 * Tests de brandingUtils: conversión de color hex→HSL e inyección de Google Fonts.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { hexToHslValues, loadGoogleFonts } from '../lib/brandingUtils'

describe('hexToHslValues', () => {
  it('convierte negro y blanco', () => {
    expect(hexToHslValues('#000000')).toBe('0 0% 0%')
    expect(hexToHslValues('#ffffff')).toBe('0 0% 100%')
  })
  it('convierte colores primarios', () => {
    expect(hexToHslValues('#ff0000')).toBe('0 100% 50%') // rojo
    expect(hexToHslValues('#00ff00')).toBe('120 100% 50%') // verde
    expect(hexToHslValues('#0000ff')).toBe('240 100% 50%') // azul
  })
  it('tolera hex sin almohadilla', () => {
    expect(hexToHslValues('ff0000')).toBe('0 100% 50%')
  })
  it('retorna negro ante valor vacío', () => {
    expect(hexToHslValues('')).toBe('0 0% 0%')
  })
  it('produce gris acromático (saturación 0)', () => {
    expect(hexToHslValues('#808080')).toMatch(/^0 0% \d+%$/)
  })
})

describe('loadGoogleFonts', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })
  it('inyecta un <link> de Google Fonts con las familias', () => {
    loadGoogleFonts('Inter', 'Roboto', 'Lobster')
    const link = document.getElementById('branding-google-fonts') as HTMLLinkElement
    expect(link).toBeTruthy()
    expect(link.tagName).toBe('LINK')
    expect(link.getAttribute('href')).toContain('fonts.googleapis.com')
    expect(link.getAttribute('href')).toContain('Inter')
    expect(link.getAttribute('href')).toContain('Roboto')
  })
  it('no inyecta nada si solo hay system-ui', () => {
    loadGoogleFonts('system-ui', 'system-ui')
    expect(document.getElementById('branding-google-fonts')).toBeNull()
  })
  it('reemplaza el link previo en vez de duplicarlo', () => {
    loadGoogleFonts('Inter', 'Roboto')
    loadGoogleFonts('Poppins', 'Lato')
    expect(document.querySelectorAll('#branding-google-fonts')).toHaveLength(1)
    expect(document.getElementById('branding-google-fonts')!.getAttribute('href')).toContain('Poppins')
  })
})
