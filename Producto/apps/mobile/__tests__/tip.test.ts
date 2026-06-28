import { describe, it, expect } from 'vitest'
import { effectiveTip, tipPercent } from '../lib/tip'

describe('effectiveTip', () => {
  it('usa el monto fijo del cliente cuando tipAmount > 0', () => {
    expect(effectiveTip(10000, true, 2500)).toBe(2500)
    expect(effectiveTip(10000, false, 1500)).toBe(1500)
  })

  it('cae al 10% cuando solo está tipIncluded (legacy/garzón)', () => {
    expect(effectiveTip(10000, true, 0)).toBe(1000)
    expect(effectiveTip(10000, true, null)).toBe(1000)
  })

  it('0 cuando no hay propina', () => {
    expect(effectiveTip(10000, false, 0)).toBe(0)
    expect(effectiveTip(10000, false, null)).toBe(0)
  })
})

describe('tipPercent', () => {
  it('calcula el porcentaje respecto al consumo', () => {
    expect(tipPercent(10000, 1500)).toBe(15)
    expect(tipPercent(10000, 1000)).toBe(10)
  })
  it('0 cuando el total es 0', () => {
    expect(tipPercent(0, 500)).toBe(0)
  })
})
