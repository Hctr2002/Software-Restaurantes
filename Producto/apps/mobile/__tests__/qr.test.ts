import { describe, it, expect } from 'vitest'
import { parseQrTableUrl } from '../lib/qr'

describe('parseQrTableUrl', () => {
  it('parsea URL de producción SIN esquema (caso del bug)', () => {
    // El QR de prod venía como host/slug/mesa sin https:// y antes tomaba el host como slug.
    expect(parseQrTableUrl('portal-menubites.vercel.app/gourmet-restaurant/4')).toEqual({
      slug: 'gourmet-restaurant',
      table: '4',
    })
  })

  it('parsea URL completa con https://', () => {
    expect(parseQrTableUrl('https://portal-menubites.vercel.app/gourmet-restaurant/4')).toEqual({
      slug: 'gourmet-restaurant',
      table: '4',
    })
  })

  it('parsea ruta directa slug/mesa', () => {
    expect(parseQrTableUrl('la-parrilla/5')).toEqual({ slug: 'la-parrilla', table: '5' })
  })

  it('ignora query string y trailing slash', () => {
    expect(parseQrTableUrl('portal-menubites.vercel.app/gourmet-restaurant/4?x=1')).toEqual({
      slug: 'gourmet-restaurant',
      table: '4',
    })
    expect(parseQrTableUrl('https://host.com/mi-rest/9/')).toEqual({ slug: 'mi-rest', table: '9' })
  })

  it('retorna null para entradas inválidas', () => {
    expect(parseQrTableUrl('')).toBeNull()
    expect(parseQrTableUrl('solo-texto')).toBeNull()
    expect(parseQrTableUrl('https://portal-menubites.vercel.app/')).toBeNull()
  })
})
