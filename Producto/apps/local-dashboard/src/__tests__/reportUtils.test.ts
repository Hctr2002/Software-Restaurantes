/**
 * Tests de las funciones puras de reportUtils (cálculo y exportación de reportes).
 * Se omite downloadXML (glue de DOM); el resto es lógica pura determinista.
 */
import { describe, it, expect } from 'vitest'
import {
  diffMinutes,
  avgOrNull,
  todayISO,
  daysAgoISO,
  formatShortDate,
  medalColor,
  orderItemTotal,
  processDailyReports,
  processTopItems,
  processTableReports,
  processStaffReports,
  buildSpreadsheetML,
  buildTimingStats,
} from '../lib/reportUtils'

describe('helpers básicos', () => {
  it('diffMinutes calcula minutos entre dos ISO', () => {
    expect(diffMinutes('2026-06-01T10:00:00Z', '2026-06-01T10:30:00Z')).toBe(30)
  })
  it('diffMinutes retorna null si falta algún valor', () => {
    expect(diffMinutes(null, '2026-06-01T10:00:00Z')).toBeNull()
    expect(diffMinutes('2026-06-01T10:00:00Z', undefined)).toBeNull()
  })
  it('avgOrNull promedia y redondea', () => {
    expect(avgOrNull([10, 20, 30])).toBe(20)
    expect(avgOrNull([1, 2])).toBe(2) // 1.5 → 2
  })
  it('avgOrNull retorna 0 con arreglo vacío', () => {
    expect(avgOrNull([])).toBe(0)
  })
  it('todayISO y daysAgoISO devuelven formato YYYY-MM-DD', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(daysAgoISO(7)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('daysAgoISO(1) equivale a hoy', () => {
    expect(daysAgoISO(1)).toBe(todayISO())
  })
  it('formatShortDate produce texto localizado', () => {
    expect(typeof formatShortDate('2026-06-01')).toBe('string')
    expect(formatShortDate('2026-06-01').length).toBeGreaterThan(0)
  })
  it('medalColor asigna colores por posición', () => {
    expect(medalColor(0)).toContain('yellow')
    expect(medalColor(1)).toContain('slate')
    expect(medalColor(2)).toContain('amber')
    expect(medalColor(5)).toContain('foreground')
  })
  it('orderItemTotal multiplica precio por cantidad con defaults', () => {
    expect(orderItemTotal({ unitPrice: 1000, quantity: 3 })).toBe(3000)
    expect(orderItemTotal({ unitPrice: 500 })).toBe(500) // quantity default 1
    expect(orderItemTotal({})).toBe(0)
  })
})

const order = (overrides: any = {}) => ({
  createdAt: '2026-06-01T10:00:00Z',
  order_items: [{ unitPrice: 1000, quantity: 2, menu_items: { name: 'Burger' } }],
  ...overrides,
})

describe('processDailyReports', () => {
  it('agrupa por día y calcula ingresos, pedidos y ticket promedio', () => {
    const orders = [
      order(),
      order({ createdAt: '2026-06-01T15:00:00Z', order_items: [{ unitPrice: 2000, quantity: 1 }] }),
      order({ createdAt: '2026-06-02T11:00:00Z', order_items: [{ unitPrice: 500, quantity: 1 }] }),
    ]
    const res = processDailyReports(orders, '2026-06-01', '2026-06-02')
    expect(res).toHaveLength(2)
    const d1 = res.find((r) => r.date === '2026-06-01')!
    expect(d1.orders).toBe(2)
    expect(d1.revenue).toBe(4000) // 2000 + 2000
    expect(d1.avg).toBe(2000)
    const d2 = res.find((r) => r.date === '2026-06-02')!
    expect(d2.orders).toBe(1)
    expect(d2.revenue).toBe(500)
  })
  it('incluye días sin pedidos con valores en cero', () => {
    const res = processDailyReports([], '2026-06-01', '2026-06-03')
    expect(res).toHaveLength(3)
    expect(res.every((r) => r.orders === 0 && r.revenue === 0 && r.avg === 0)).toBe(true)
  })
  it('ignora pedidos fuera del rango', () => {
    const res = processDailyReports([order({ createdAt: '2025-01-01T10:00:00Z' })], '2026-06-01', '2026-06-01')
    expect(res[0].orders).toBe(0)
  })
})

describe('processTopItems', () => {
  it('cuenta y suma ingresos por ítem, ordenado por conteo, top 10', () => {
    const orders = [
      order({ order_items: [{ unitPrice: 1000, quantity: 1, menu_items: { name: 'Burger' } }] }),
      order({ order_items: [{ unitPrice: 1000, quantity: 1, menu_items: { name: 'Burger' } }] }),
      order({ order_items: [{ unitPrice: 500, quantity: 1, menu_items: { name: 'Fries' } }] }),
    ]
    const res = processTopItems(orders)
    expect(res[0]).toMatchObject({ name: 'Burger', count: 2, revenue: 2000 })
    expect(res[1]).toMatchObject({ name: 'Fries', count: 1 })
  })
  it('ignora ítems sin nombre', () => {
    const res = processTopItems([order({ order_items: [{ unitPrice: 100, quantity: 1 }] })])
    expect(res).toHaveLength(0)
  })
})

describe('processTableReports / processStaffReports', () => {
  it('agrupa por mesa ordenado por ingreso', () => {
    const orders = [
      order({ tables: { number: 1 }, order_items: [{ unitPrice: 500, quantity: 1 }] }),
      order({ tables: { number: 2 }, order_items: [{ unitPrice: 5000, quantity: 1 }] }),
    ]
    const res = processTableReports(orders)
    expect(res[0].number).toBe(2) // mayor ingreso primero
    expect(res[0].revenue).toBe(5000)
  })
  it('agrupa por email de garzón', () => {
    const orders = [
      order({ users: { email: 'a@r.com' }, order_items: [{ unitPrice: 1000, quantity: 1 }] }),
      order({ users: { email: 'a@r.com' }, order_items: [{ unitPrice: 1000, quantity: 1 }] }),
      order({ users: { email: 'b@r.com' }, order_items: [{ unitPrice: 9000, quantity: 1 }] }),
    ]
    const res = processStaffReports(orders)
    expect(res[0].email).toBe('b@r.com')
    expect(res.find((r) => r.email === 'a@r.com')!.orders).toBe(2)
  })
  it('ignora pedidos sin mesa o sin garzón', () => {
    expect(processTableReports([order({ tables: null })])).toHaveLength(0)
    expect(processStaffReports([order({ users: null })])).toHaveLength(0)
  })
})

describe('buildSpreadsheetML', () => {
  it('genera XML con las cuatro hojas', () => {
    const xml = buildSpreadsheetML(
      'Junio',
      [{ date: '2026-06-01', orders: 2, revenue: 4000, avg: 2000 }],
      [{ email: 'a@r.com', orders: 2, revenue: 4000 }],
      [{ name: 'Burger', count: 2, revenue: 2000 }],
      [{ number: 1, orders: 2, revenue: 4000 }],
    )
    expect(xml).toContain('Ventas por Día')
    expect(xml).toContain('Ranking Garzones')
    expect(xml).toContain('Top Items')
    expect(xml).toContain('Ingresos por Mesa')
    expect(xml.startsWith('<?xml')).toBe(true)
  })
  it('escapa caracteres especiales XML', () => {
    const xml = buildSpreadsheetML('P', [], [{ email: 'a&b<c>"', orders: 1, revenue: 1 }], [], [])
    expect(xml).toContain('a&amp;b&lt;c&gt;&quot;')
    expect(xml).not.toContain('a&b<c>"')
  })
})

describe('buildTimingStats', () => {
  it('promedia tiempos por categoría y descarta pedidos sin readyAt', () => {
    const orders = [
      {
        createdAt: '2026-06-01T10:00:00Z',
        validatedAt: '2026-06-01T10:05:00Z',
        readyAt: '2026-06-01T10:20:00Z',
        order_items: [{ menu_items: { categories: { name: 'Platos' } } }],
      },
      {
        createdAt: '2026-06-01T11:00:00Z',
        validatedAt: '2026-06-01T11:05:00Z',
        readyAt: null, // descartado
        order_items: [{ menu_items: { categories: { name: 'Platos' } } }],
      },
    ]
    const res = buildTimingStats(orders)
    expect(res).toHaveLength(1)
    expect(res[0]).toMatchObject({ category: 'Platos', validationMin: 5, kitchenMin: 15, totalMin: 20, count: 1 })
  })
  it('usa "Sin categoría" cuando falta la categoría', () => {
    const res = buildTimingStats([
      { createdAt: '2026-06-01T10:00:00Z', validatedAt: '2026-06-01T10:05:00Z', readyAt: '2026-06-01T10:10:00Z', order_items: [] },
    ])
    expect(res[0].category).toBe('Sin categoría')
  })
})
