/**
 * Tests for lib/reportUtils.ts — pure utility functions for the mobile reports screen.
 */

import { describe, it, expect } from 'vitest'
import {
  diffMinutes,
  avgOrNull,
  todayISO,
  daysAgoISO,
  formatShortDate,
  orderItemTotal,
  processDailyReports,
  processTopItems,
  processTableReports,
  processStaffReports,
  buildTimingStats,
} from '../lib/reportUtils'

// ─── diffMinutes ─────────────────────────────────────────────────────────────
describe('diffMinutes', () => {
  it('calcula diferencia en minutos correctamente', () => {
    const a = '2024-01-01T10:00:00Z'
    const b = '2024-01-01T10:30:00Z'
    expect(diffMinutes(a, b)).toBe(30)
  })

  it('retorna null cuando alguno de los valores es null', () => {
    expect(diffMinutes(null, '2024-01-01T10:00:00Z')).toBeNull()
    expect(diffMinutes('2024-01-01T10:00:00Z', null)).toBeNull()
    expect(diffMinutes(null, null)).toBeNull()
  })

  it('retorna null cuando alguno de los valores es undefined', () => {
    expect(diffMinutes(undefined, '2024-01-01T10:00:00Z')).toBeNull()
  })

  it('retorna valor negativo cuando b es anterior a a', () => {
    const a = '2024-01-01T11:00:00Z'
    const b = '2024-01-01T10:00:00Z'
    expect(diffMinutes(a, b)).toBe(-60)
  })
})

// ─── avgOrNull ────────────────────────────────────────────────────────────────
describe('avgOrNull', () => {
  it('calcula el promedio de un array', () => {
    expect(avgOrNull([10, 20, 30])).toBe(20)
  })

  it('retorna 0 para array vacío', () => {
    expect(avgOrNull([])).toBe(0)
  })

  it('redondea al entero más cercano', () => {
    expect(avgOrNull([1, 2])).toBe(2) // 1.5 rounded
  })

  it('funciona con un solo elemento', () => {
    expect(avgOrNull([42])).toBe(42)
  })
})

// ─── todayISO ─────────────────────────────────────────────────────────────────
describe('todayISO', () => {
  it('retorna fecha en formato YYYY-MM-DD', () => {
    const result = todayISO()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('la fecha corresponde al día de hoy', () => {
    const today = new Date()
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    expect(todayISO()).toBe(expected)
  })
})

// ─── daysAgoISO ──────────────────────────────────────────────────────────────
describe('daysAgoISO', () => {
  it('retorna fecha en formato YYYY-MM-DD', () => {
    expect(daysAgoISO(7)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('con n=1 retorna el día de hoy', () => {
    expect(daysAgoISO(1)).toBe(todayISO())
  })

  it('con n=2 retorna ayer', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const expected = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    expect(daysAgoISO(2)).toBe(expected)
  })
})

// ─── formatShortDate ──────────────────────────────────────────────────────────
describe('formatShortDate', () => {
  it('retorna una cadena no vacía', () => {
    const result = formatShortDate('2024-06-15')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('incluye el día y el mes en la cadena', () => {
    const result = formatShortDate('2024-06-15')
    expect(result).toMatch(/15/)
    expect(result).toMatch(/06/)
  })
})

// ─── orderItemTotal ───────────────────────────────────────────────────────────
describe('orderItemTotal', () => {
  it('calcula precio × cantidad', () => {
    expect(orderItemTotal({ unitPrice: 2500, quantity: 3 })).toBe(7500)
  })

  it('usa cantidad 1 cuando quantity no está definido', () => {
    expect(orderItemTotal({ unitPrice: 5000 })).toBe(5000)
  })

  it('usa precio 0 cuando unitPrice no está definido', () => {
    expect(orderItemTotal({ quantity: 3 })).toBe(0)
  })

  it('maneja valores numéricos como strings', () => {
    expect(orderItemTotal({ unitPrice: '1000', quantity: '2' })).toBe(2000)
  })
})

// ─── processDailyReports ──────────────────────────────────────────────────────
describe('processDailyReports', () => {
  const orders = [
    {
      createdAt: '2024-01-03T10:00:00Z',
      order_items: [{ unitPrice: 2000, quantity: 2 }],
    },
    {
      createdAt: '2024-01-03T12:00:00Z',
      order_items: [{ unitPrice: 1500, quantity: 1 }],
    },
    {
      createdAt: '2024-01-05T09:00:00Z',
      order_items: [{ unitPrice: 3000, quantity: 1 }],
    },
  ]

  it('genera una entrada por día en el rango', () => {
    const result = processDailyReports(orders, '2024-01-01', '2024-01-07')
    expect(result.length).toBe(7)
  })

  it('acumula pedidos y revenue correctamente por día', () => {
    const result = processDailyReports(orders, '2024-01-01', '2024-01-07')
    const day3 = result.find(d => d.date === '2024-01-03')!
    expect(day3.orders).toBe(2)
    expect(day3.revenue).toBe(5500) // 2000*2 + 1500*1
  })

  it('calcula el ticket promedio del día', () => {
    const result = processDailyReports(orders, '2024-01-01', '2024-01-07')
    const day3 = result.find(d => d.date === '2024-01-03')!
    expect(day3.avg).toBe(2750) // 5500 / 2
  })

  it('días sin pedidos tienen revenue=0 y orders=0', () => {
    const result = processDailyReports(orders, '2024-01-01', '2024-01-07')
    const day1 = result.find(d => d.date === '2024-01-01')!
    expect(day1.orders).toBe(0)
    expect(day1.revenue).toBe(0)
    expect(day1.avg).toBe(0)
  })

  it('ignora pedidos fuera del rango', () => {
    const result = processDailyReports(orders, '2024-01-04', '2024-01-06')
    const total = result.reduce((s, d) => s + d.orders, 0)
    expect(total).toBe(1) // only Jan 5
  })
})

// ─── processTopItems ──────────────────────────────────────────────────────────
describe('processTopItems', () => {
  const orders = [
    {
      order_items: [
        { menu_items: { name: 'Burger' }, quantity: 2, unitPrice: 5000 },
        { menu_items: { name: 'Pizza' }, quantity: 1, unitPrice: 8000 },
      ],
    },
    {
      order_items: [
        { menu_items: { name: 'Burger' }, quantity: 3, unitPrice: 5000 },
        { menu_items: { name: 'Soda' }, quantity: 2, unitPrice: 1500 },
      ],
    },
  ]

  it('agrupa items por nombre y suma cantidades', () => {
    const result = processTopItems(orders)
    const burger = result.find(i => i.name === 'Burger')!
    expect(burger.count).toBe(5) // 2 + 3
  })

  it('ordena por cantidad descendente', () => {
    const result = processTopItems(orders)
    expect(result[0].name).toBe('Burger')
  })

  it('limita a 10 items', () => {
    const manyOrders = Array.from({ length: 15 }, (_, i) => ({
      order_items: [{ menu_items: { name: `Item${i}` }, quantity: 1, unitPrice: 100 }],
    }))
    const result = processTopItems(manyOrders)
    expect(result.length).toBeLessThanOrEqual(10)
  })

  it('ignora items sin nombre', () => {
    const ordersNoName = [{ order_items: [{ menu_items: null, quantity: 1, unitPrice: 100 }] }]
    const result = processTopItems(ordersNoName)
    expect(result.length).toBe(0)
  })
})

// ─── processTableReports ─────────────────────────────────────────────────────
describe('processTableReports', () => {
  const orders = [
    {
      tables: { number: 3 },
      order_items: [{ unitPrice: 2000, quantity: 1 }],
    },
    {
      tables: { number: 3 },
      order_items: [{ unitPrice: 3000, quantity: 2 }],
    },
    {
      tables: { number: 5 },
      order_items: [{ unitPrice: 5000, quantity: 1 }],
    },
    {
      tables: null,
      order_items: [{ unitPrice: 1000, quantity: 1 }],
    },
  ]

  it('agrupa pedidos por número de mesa', () => {
    const result = processTableReports(orders)
    expect(result.find(t => t.number === 3)!.orders).toBe(2)
  })

  it('suma el revenue por mesa', () => {
    const result = processTableReports(orders)
    const t3 = result.find(t => t.number === 3)!
    expect(t3.revenue).toBe(8000) // 2000 + 6000
  })

  it('ordena por revenue descendente', () => {
    const result = processTableReports(orders)
    expect(result[0].number).toBe(3)
  })

  it('ignora pedidos sin mesa', () => {
    const result = processTableReports(orders)
    expect(result.some(t => isNaN(t.number))).toBe(false)
  })
})

// ─── processStaffReports ─────────────────────────────────────────────────────
describe('processStaffReports', () => {
  const orders = [
    {
      users: { email: 'garzon1@test.com' },
      order_items: [{ unitPrice: 5000, quantity: 2 }],
    },
    {
      users: { email: 'garzon1@test.com' },
      order_items: [{ unitPrice: 3000, quantity: 1 }],
    },
    {
      users: { email: 'garzon2@test.com' },
      order_items: [{ unitPrice: 8000, quantity: 1 }],
    },
    {
      users: null,
      order_items: [{ unitPrice: 1000, quantity: 1 }],
    },
  ]

  it('agrupa por email y suma pedidos', () => {
    const result = processStaffReports(orders)
    const g1 = result.find(s => s.email === 'garzon1@test.com')!
    expect(g1.orders).toBe(2)
  })

  it('suma el revenue por garzón', () => {
    const result = processStaffReports(orders)
    const g1 = result.find(s => s.email === 'garzon1@test.com')!
    expect(g1.revenue).toBe(13000) // 10000 + 3000
  })

  it('ordena por revenue descendente', () => {
    const result = processStaffReports(orders)
    expect(result[0].email).toBe('garzon1@test.com')
  })

  it('ignora pedidos sin usuario asignado', () => {
    const result = processStaffReports(orders)
    expect(result.length).toBe(2) // solo garzon1 y garzon2
  })
})

// ─── buildTimingStats ─────────────────────────────────────────────────────────
describe('buildTimingStats', () => {
  const orders = [
    {
      createdAt: '2024-01-01T10:00:00Z',
      validatedAt: '2024-01-01T10:05:00Z',
      readyAt: '2024-01-01T10:20:00Z',
      order_items: [{ menu_items: { categories: { name: 'Platos' } } }],
    },
    {
      createdAt: '2024-01-01T11:00:00Z',
      validatedAt: '2024-01-01T11:03:00Z',
      readyAt: '2024-01-01T11:18:00Z',
      order_items: [{ menu_items: { categories: { name: 'Platos' } } }],
    },
    {
      createdAt: '2024-01-01T12:00:00Z',
      validatedAt: '2024-01-01T12:02:00Z',
      readyAt: null, // no readyAt — excluido
      order_items: [{ menu_items: { categories: { name: 'Platos' } } }],
    },
  ]

  it('agrupa por categoría', () => {
    const result = buildTimingStats(orders)
    expect(result.some(s => s.category === 'Platos')).toBe(true)
  })

  it('calcula tiempos promedio', () => {
    const result = buildTimingStats(orders)
    const platos = result.find(s => s.category === 'Platos')!
    expect(platos.totalMin).toBeGreaterThan(0)
    expect(platos.kitchenMin).toBeGreaterThan(0)
  })

  it('excluye pedidos sin readyAt', () => {
    const result = buildTimingStats(orders)
    const platos = result.find(s => s.category === 'Platos')!
    expect(platos.count).toBe(2) // 3rd order excluded
  })

  it('usa "Sin categoría" cuando no hay categoría definida', () => {
    const noCatOrders = [{
      createdAt: '2024-01-01T10:00:00Z',
      validatedAt: '2024-01-01T10:05:00Z',
      readyAt: '2024-01-01T10:15:00Z',
      order_items: [{ menu_items: null }],
    }]
    const result = buildTimingStats(noCatOrders)
    expect(result.some(s => s.category === 'Sin categoría')).toBe(true)
  })

  it('retorna array vacío cuando no hay pedidos con readyAt', () => {
    const result = buildTimingStats([])
    expect(result).toEqual([])
  })
})
