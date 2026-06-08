/**
 * Tests de la capa de servicios de datos (menuService, tableService, themeService).
 * Mockea createServiceClient con una cadena que registra las llamadas y resuelve por tabla,
 * permitiendo verificar el aislamiento por restaurant_id y la lógica propia de cada servicio
 * (generación de QR, bloqueo por órdenes activas, activación de tema, mapeo de campos).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCreateServiceClient } = vi.hoisted(() => ({ mockCreateServiceClient: vi.fn() }))
vi.mock('@/lib/localApi', () => ({
  createServiceClient: () => mockCreateServiceClient(),
  ensureServiceConfig: vi.fn(),
  requireAdmin: vi.fn(),
  createSessionClient: vi.fn(),
}))

import { menuService } from '../lib/services/menuService'
import { tableService } from '../lib/services/tableService'
import { themeService } from '../lib/services/themeService'

const calls: { table: string; method: string; payload?: any; args?: any[] }[] = []
let perTable: Record<string, any> = {}

function chainFor(table: string) {
  const resolved = () => perTable[table] ?? { data: null, error: null }
  const chain: any = {}
  chain.then = (r: any) => Promise.resolve(resolved()).then(r)
  ;['eq', 'in', 'not', 'order', 'gte', 'lte', 'neq', 'filter'].forEach((m) => {
    chain[m] = vi.fn(() => chain)
  })
  chain.select = vi.fn((...args: any[]) => {
    calls.push({ table, method: 'select', args })
    return chain
  })
  chain.insert = vi.fn((payload: any) => {
    calls.push({ table, method: 'insert', payload })
    return chain
  })
  chain.update = vi.fn((payload: any) => {
    calls.push({ table, method: 'update', payload })
    return chain
  })
  chain.delete = vi.fn(() => {
    calls.push({ table, method: 'delete' })
    return chain
  })
  chain.single = vi.fn(() => Promise.resolve(resolved()))
  return chain
}

const inserts = (t: string) => calls.filter((c) => c.table === t && c.method === 'insert')
const updates = (t: string) => calls.filter((c) => c.table === t && c.method === 'update')

beforeEach(() => {
  calls.length = 0
  perTable = {}
  mockCreateServiceClient.mockReturnValue({ from: vi.fn((t: string) => chainFor(t)) })
})

// ─── menuService ─────────────────────────────────────────────────────────────
describe('menuService', () => {
  it('create añade restaurant_id y normaliza description a null', async () => {
    perTable.menu_items = { data: { id: 'm1' }, error: null }
    await menuService.create('r1', { name: 'Burger', price: 5000, is_active: true, category_id: 'c1' } as any)
    const payload = inserts('menu_items')[0].payload
    expect(payload.restaurant_id).toBe('r1')
    expect(payload.description).toBeNull()
    expect(payload.name).toBe('Burger')
  })

  it('getByRestaurant retorna lo que da la BD', async () => {
    perTable.menu_items = { data: [{ id: 'm1' }], error: null }
    const res = await menuService.getByRestaurant('r1')
    expect(res.data).toEqual([{ id: 'm1' }])
  })

  it('delete propaga error de la BD', async () => {
    perTable.menu_items = { data: null, error: { message: 'x' } }
    const res = await menuService.delete('r1', 'm1')
    expect(res.error).toEqual({ message: 'x' })
  })
})

// ─── tableService ────────────────────────────────────────────────────────────
describe('tableService', () => {
  it('create genera qr_data con el slug del restaurante', async () => {
    perTable.restaurants = { data: { slug: 'mi-rest' }, error: null }
    perTable.tables = { data: { id: 't1' }, error: null }
    await tableService.create('r1', { number: 5, status: 'FREE' } as any)
    const payload = inserts('tables')[0].payload
    expect(payload.qr_data).toContain('/mi-rest/5')
    expect(payload.restaurant_id).toBe('r1')
    expect(payload.label).toBeNull()
  })

  it('create usa restaurantId como fallback si no hay slug', async () => {
    perTable.restaurants = { data: null, error: null }
    perTable.tables = { data: { id: 't1' }, error: null }
    await tableService.create('r1', { number: 9, status: 'FREE' } as any)
    expect(inserts('tables')[0].payload.qr_data).toContain('/r1/9')
  })

  it('delete bloquea cuando hay órdenes activas', async () => {
    perTable.orders = { count: 3, error: null }
    const res = await tableService.delete('r1', 't1')
    expect(res.data).toBeNull()
    expect(res.error?.message).toContain('3 orden')
    // no debe intentar borrar la mesa
    expect(calls.some((c) => c.table === 'tables' && c.method === 'delete')).toBe(false)
  })

  it('delete procede cuando no hay órdenes activas', async () => {
    perTable.orders = { count: 0, error: null }
    perTable.tables = { data: null, error: null }
    const res = await tableService.delete('r1', 't1')
    expect(calls.some((c) => c.table === 'tables' && c.method === 'delete')).toBe(true)
    expect(res.error).toBeNull()
  })

  it('delete retorna error si falla la verificación de órdenes', async () => {
    perTable.orders = { count: null, error: { message: 'boom' } }
    const res = await tableService.delete('r1', 't1')
    expect(res.error?.message).toContain('Error al verificar')
  })
})

// ─── themeService ────────────────────────────────────────────────────────────
describe('themeService', () => {
  it('save mapea camelCase a snake_case', async () => {
    perTable.restaurant_themes = { data: { id: 'th1' }, error: null }
    await themeService.save('r1', {
      name: 'Oscuro',
      paletteName: 'noche',
      isCustom: true,
      isActive: true,
      primaryColor: '#111',
      secondaryColor: '#222',
      backgroundColor: '#000',
      accentColor: '#f00',
      textColor: '#fff',
      cardBackground: '#333',
      fontTitle: 'Inter',
      fontBody: 'Roboto',
      fontAccent: 'Lobster',
      logoUrl: null,
    } as any)
    const payload = inserts('restaurant_themes')[0].payload
    expect(payload.palette_name).toBe('noche')
    expect(payload.primary_color).toBe('#111')
    expect(payload.is_active).toBe(true)
    expect(payload.restaurant_id).toBe('r1')
  })

  it('activate primero desactiva todos y luego activa el seleccionado', async () => {
    perTable.restaurant_themes = { data: { id: 'th1' }, error: null }
    await themeService.activate('r1', 'th1')
    const ups = updates('restaurant_themes')
    expect(ups).toHaveLength(2)
    expect(ups[0].payload).toEqual({ is_active: false })
    expect(ups[1].payload).toEqual({ is_active: true })
  })

  it('update solo incluye los campos provistos', async () => {
    perTable.restaurant_themes = { data: { id: 'th1' }, error: null }
    await themeService.update('r1', 'th1', { name: 'Nuevo' } as any)
    const payload = updates('restaurant_themes')[0].payload
    expect(payload.name).toBe('Nuevo')
    expect(payload).not.toHaveProperty('primary_color')
    expect(payload).toHaveProperty('updated_at')
  })

  it('deleteMany filtra por lista de ids', async () => {
    perTable.restaurant_themes = { data: null, error: null }
    const res = await themeService.deleteMany('r1', ['a', 'b'])
    expect(calls.some((c) => c.table === 'restaurant_themes' && c.method === 'delete')).toBe(true)
    expect(res.error).toBeNull()
  })
})
