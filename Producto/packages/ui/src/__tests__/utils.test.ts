import { describe, it, expect, vi, afterEach } from 'vitest'
import { cn, formatDate, formatPrice, timeAgo } from '../lib/utils'

describe('cn (class merger)', () => {
  it('combina clases simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('elimina clases duplicadas de Tailwind (tailwind-merge)', () => {
    // tailwind-merge deduplicates conflicting utilities
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('descarta valores falsy', () => {
    expect(cn('foo', undefined, null, false, 'bar')).toBe('foo bar')
  })

  it('maneja expresiones condicionales con clsx', () => {
    const active = true
    expect(cn('base', active && 'active')).toBe('base active')
    expect(cn('base', !active && 'inactive')).toBe('base')
  })

  it('retorna string vacío sin argumentos', () => {
    expect(cn()).toBe('')
  })
})

describe('formatDate', () => {
  it('retorna "—" para undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('retorna "—" para null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('retorna "Fecha inválida" para string no parseable', () => {
    expect(formatDate('no-es-fecha')).toBe('Fecha inválida')
  })

  it('formatea fecha ISO a locale chileno dd/mm/yyyy hh:mm', () => {
    const result = formatDate('2024-06-15T10:30:00.000Z')
    // Node/jsdom may use dashes or slashes depending on ICU data version
    expect(result).toMatch(/\d{2}[-/]\d{2}[-/]\d{4}/)
    expect(result).toContain('2024')
    expect(result).toContain('15')
  })
})

describe('formatPrice', () => {
  it('formatea número como CLP con símbolo $', () => {
    const result = formatPrice(5000)
    expect(result).toContain('$')
    expect(result).toContain('5.000')
  })

  it('formatea 0', () => {
    expect(formatPrice(0)).toContain('0')
  })

  it('formatea números grandes con separador de miles', () => {
    const result = formatPrice(1000000)
    expect(result).toContain('1.000.000')
  })
})

describe('timeAgo', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('retorna "Hace un momento" para menos de 1 minuto', () => {
    const iso = new Date(Date.now() - 30_000).toISOString()
    expect(timeAgo(iso)).toBe('Hace un momento')
  })

  it('retorna "Hace 1 min" para exactamente 1 minuto', () => {
    const iso = new Date(Date.now() - 60_000).toISOString()
    expect(timeAgo(iso)).toBe('Hace 1 min')
  })

  it('retorna "Hace {n} min" para menos de 60 minutos', () => {
    const iso = new Date(Date.now() - 20 * 60_000).toISOString()
    expect(timeAgo(iso)).toBe('Hace 20 min')
  })

  it('retorna "Hace {n}h {m}min" para 1+ horas', () => {
    const iso = new Date(Date.now() - (90 * 60_000)).toISOString()
    expect(timeAgo(iso)).toMatch(/Hace 1h \d+min/)
  })
})
