/**
 * Tests for pure utility functions across mobile lib files:
 * - lib/uuid.ts       — uuidv4
 * - lib/dashboard.ts  — formatCurrency, timeAgo
 * - constants/MB_Theme.ts — TIP_RATE, constants
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uuidv4 } from '../lib/uuid'
import { formatCurrency, timeAgo } from '../lib/dashboard'
import { TIP_RATE, MB_COLORS, MB_SPACING, MB_RADIUS } from '../constants/MB_Theme'

// dashboard.ts imports supabase — mock to avoid native module errors
vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

// ─── uuidv4 ───────────────────────────────────────────────────────────────────
describe('uuidv4', () => {
  it('genera un UUID con formato estándar', () => {
    const id = uuidv4()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('genera UUIDs únicos en llamadas sucesivas', () => {
    const ids = new Set(Array.from({ length: 20 }, () => uuidv4()))
    expect(ids.size).toBe(20)
  })

  it('usa el fallback cuando crypto.randomUUID no está disponible', () => {
    const originalRandomUUID = crypto.randomUUID
    // @ts-ignore
    delete crypto.randomUUID
    const id = uuidv4()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    crypto.randomUUID = originalRandomUUID
  })
})

// ─── formatCurrency ───────────────────────────────────────────────────────────
describe('formatCurrency', () => {
  it('formatea un número como moneda CLP', () => {
    const result = formatCurrency(15000)
    expect(result).toContain('15')
    expect(result).toContain('000')
  })

  it('formatea cero correctamente', () => {
    const result = formatCurrency(0)
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('formatea números grandes', () => {
    const result = formatCurrency(1000000)
    expect(result).toContain('1')
    expect(typeof result).toBe('string')
  })
})

// ─── timeAgo ─────────────────────────────────────────────────────────────────
describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))
  })

  it('retorna "Ahora" para menos de 1 minuto', () => {
    const recent = new Date('2024-01-01T11:59:30Z').toISOString()
    expect(timeAgo(recent)).toBe('Ahora')
  })

  it('retorna "1 min" para exactamente 1 minuto', () => {
    const oneMinAgo = new Date('2024-01-01T11:59:00Z').toISOString()
    expect(timeAgo(oneMinAgo)).toBe('1 min')
  })

  it('retorna "N min" para minutos entre 2 y 59', () => {
    const thirtyMinAgo = new Date('2024-01-01T11:30:00Z').toISOString()
    expect(timeAgo(thirtyMinAgo)).toBe('30 min')
  })

  it('retorna horas y minutos para más de 60 minutos', () => {
    const nintyMinAgo = new Date('2024-01-01T10:30:00Z').toISOString()
    const result = timeAgo(nintyMinAgo)
    expect(result).toContain('h')
  })

  it('retorna días para más de 24 horas', () => {
    const twoDaysAgo = new Date('2023-12-30T12:00:00Z').toISOString()
    const result = timeAgo(twoDaysAgo)
    expect(result).toContain('d')
  })
})

// ─── MB_Theme constants ───────────────────────────────────────────────────────
describe('MB_Theme constants', () => {
  it('TIP_RATE es 0.10', () => {
    expect(TIP_RATE).toBe(0.10)
  })

  it('MB_COLORS contiene las claves principales', () => {
    expect(MB_COLORS).toHaveProperty('navy')
    expect(MB_COLORS).toHaveProperty('brandAccent')
    expect(MB_COLORS).toHaveProperty('cream')
  })

  it('MB_SPACING contiene todas las claves de espaciado', () => {
    expect(MB_SPACING).toHaveProperty('xs')
    expect(MB_SPACING).toHaveProperty('sm')
    expect(MB_SPACING).toHaveProperty('md')
    expect(MB_SPACING).toHaveProperty('lg')
    expect(MB_SPACING).toHaveProperty('xl')
  })

  it('MB_RADIUS contiene valores de border radius', () => {
    expect(MB_RADIUS.full).toBe(999)
    expect(MB_RADIUS.sm).toBeLessThan(MB_RADIUS.md)
    expect(MB_RADIUS.md).toBeLessThan(MB_RADIUS.lg)
  })
})
