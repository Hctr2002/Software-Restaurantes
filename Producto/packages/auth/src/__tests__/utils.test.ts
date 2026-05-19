import { describe, it, expect, vi, beforeEach } from 'vitest'

// Supabase must be mocked before any import from the package
const mockGetPublicUrl = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: vi.fn(),
    storage: {
      from: vi.fn(() => ({ getPublicUrl: mockGetPublicUrl })),
    },
  })),
}))

import {
  mapMenuItem,
  mapCategory,
  mapTable,
  mapOrder,
  formatCLP,
  formatDateTime,
  timeAgo,
  orderItemTotal,
  diffMinutes,
  pluralize,
  getPublicImageUrl,
} from '../utils'

describe('mapMenuItem', () => {
  it('mapea campos snake_case a camelCase', () => {
    const raw = {
      id: 'item-1',
      name: 'Empanada',
      description: 'Rellena de pino',
      price: 1500,
      category_id: 'cat-1',
      image_url: '/img/empanada.jpg',
      is_active: true,
      restaurant_id: 'rest-1',
    }
    const result = mapMenuItem(raw)
    expect(result.categoryId).toBe('cat-1')
    expect(result.imageUrl).toBe('/img/empanada.jpg')
    expect(result.isActive).toBe(true)
    expect(result.restaurantId).toBe('rest-1')
    expect(result.name).toBe('Empanada')
  })
})

describe('mapCategory', () => {
  it('mapea snake_case a camelCase incluyendo targetStation', () => {
    const raw = {
      id: 'cat-1',
      name: 'Parrilla',
      restaurant_id: 'rest-1',
      target_station: 'KITCHEN',
      is_active: true,
    }
    const result = mapCategory(raw)
    expect(result.restaurantId).toBe('rest-1')
    expect(result.targetStation).toBe('KITCHEN')
    expect(result.isActive).toBe(true)
  })
})

describe('mapTable', () => {
  it('mapea todos los campos de mesa correctamente', () => {
    const raw = {
      id: 'table-1',
      number: 5,
      label: 'Terraza',
      status: 'OCCUPIED',
      restaurant_id: 'rest-1',
      qr_data: 'https://qr.example.com/table-1',
      bill_requested: true,
      help_requested: false,
    }
    const result = mapTable(raw)
    expect(result.restaurantId).toBe('rest-1')
    expect(result.qrData).toBe('https://qr.example.com/table-1')
    expect(result.billRequested).toBe(true)
    expect(result.helpRequested).toBe(false)
  })
})

describe('mapOrder', () => {
  const baseRaw = {
    id: 'order-1',
    restaurant_id: 'rest-1',
    table_id: 'table-1',
    user_id: 'user-1',
    session_id: 'sess-1',
    status: 'PENDING',
    notes: null,
    total_amount: '12500',
    created_at: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:05:00.000Z',
    validated_at: null,
    preparing_at: null,
    ready_at: null,
    station: null,
    parent_order_id: null,
    kitchen_ready: false,
    bar_ready: false,
    kitchen_preparing: false,
    bar_preparing: false,
  }

  it('mapea campos básicos de pedido', () => {
    const result = mapOrder({ ...baseRaw, order_items: [] })
    expect(result.restaurantId).toBe('rest-1')
    expect(result.tableId).toBe('table-1')
    expect(result.userId).toBe('user-1')
    expect(result.sessionId).toBe('sess-1')
    expect(result.totalAmount).toBe(12500)
    expect(result.createdAt).toBe('2024-01-15T10:00:00.000Z')
  })

  it('convierte totalAmount a número', () => {
    const result = mapOrder({ ...baseRaw, total_amount: '9999.50', order_items: [] })
    expect(result.totalAmount).toBe(9999.50)
    expect(typeof result.totalAmount).toBe('number')
  })

  it('asigna flags de cocina y barra con valor por defecto false', () => {
    const result = mapOrder({ ...baseRaw, order_items: [] })
    expect(result.kitchenReady).toBe(false)
    expect(result.barReady).toBe(false)
    expect(result.kitchenPreparing).toBe(false)
    expect(result.barPreparing).toBe(false)
  })

  it('mapea order_items con sus campos', () => {
    const raw = {
      ...baseRaw,
      order_items: [
        {
          id: 'oi-1',
          order_id: 'order-1',
          menu_item_id: 'item-1',
          restaurant_id: 'rest-1',
          unit_price: '3500',
          quantity: 2,
          notes: 'Sin cebolla',
          menu_items: { name: 'Lomo', category: { target_station: 'KITCHEN' } },
        },
      ],
    }
    const result = mapOrder(raw)
    expect(result.orderItems).toHaveLength(1)
    const oi = result.orderItems![0]
    expect(oi.orderId).toBe('order-1')
    expect(oi.menuItemId).toBe('item-1')
    expect(oi.unitPrice).toBe(3500)
    expect(oi.menuItem?.name).toBe('Lomo')
    // mapOrder returns a partial shape for menuItem; category is not in the MenuItem type
    expect((oi.menuItem as any)?.category?.targetStation).toBe('KITCHEN')
  })

  it('acepta alias "items" en lugar de "order_items"', () => {
    const raw = {
      ...baseRaw,
      items: [{ id: 'oi-2', order_id: 'order-1', menu_item_id: 'item-2', restaurant_id: 'rest-1', unit_price: '1000', quantity: 1 }],
    }
    const result = mapOrder(raw)
    expect(result.orderItems).toHaveLength(1)
  })

  it('retorna undefined para orderItems cuando no hay items', () => {
    const result = mapOrder({ ...baseRaw })
    expect(result.orderItems).toBeUndefined()
  })

  it('asigna parentOrderId como null por defecto', () => {
    const result = mapOrder({ ...baseRaw, order_items: [] })
    expect(result.parentOrderId).toBeNull()
  })
})

describe('formatCLP', () => {
  it('formatea a peso chileno', () => {
    const result = formatCLP(1500)
    expect(result).toContain('1.500')
    expect(result).toContain('$')
  })

  it('formatea cero', () => {
    const result = formatCLP(0)
    expect(result).toContain('0')
  })

  it('formatea números grandes', () => {
    const result = formatCLP(1000000)
    expect(result).toContain('1.000.000')
  })
})

describe('formatDateTime', () => {
  it('formatea fecha ISO a locale chileno', () => {
    const result = formatDateTime('2024-01-15T10:30:00.000Z')
    // Node/jsdom may use dashes or slashes depending on ICU data version
    expect(result).toMatch(/\d{2}[-/]\d{2}[-/]\d{4}/)
    expect(result).toContain('2024')
    expect(result).toContain('01')
    expect(result).toContain('15')
  })
})

describe('timeAgo', () => {
  it('retorna "Ahora" para menos de 1 minuto', () => {
    const iso = new Date(Date.now() - 30_000).toISOString()
    expect(timeAgo(iso)).toBe('Ahora')
  })

  it('retorna "1 min" para exactamente 1 minuto', () => {
    const iso = new Date(Date.now() - 60_000).toISOString()
    expect(timeAgo(iso)).toBe('1 min')
  })

  it('retorna "{n} min" para menos de 60 minutos', () => {
    const iso = new Date(Date.now() - 15 * 60_000).toISOString()
    expect(timeAgo(iso)).toBe('15 min')
  })

  it('retorna "{n}h" para 60 o más minutos', () => {
    const iso = new Date(Date.now() - 2 * 60 * 60_000).toISOString()
    expect(timeAgo(iso)).toBe('2h')
  })
})

describe('orderItemTotal', () => {
  it('calcula unit_price × quantity', () => {
    expect(orderItemTotal({ unit_price: 1500, quantity: 3 })).toBe(4500)
  })

  it('acepta unit_price como string', () => {
    expect(orderItemTotal({ unit_price: '1200', quantity: 2 })).toBe(2400)
  })

  it('retorna 0 para quantity 0', () => {
    expect(orderItemTotal({ unit_price: 1500, quantity: 0 })).toBe(0)
  })
})

describe('diffMinutes', () => {
  it('retorna null si alguna fecha es null', () => {
    expect(diffMinutes(null, '2024-01-15T10:00:00Z')).toBeNull()
    expect(diffMinutes('2024-01-15T10:00:00Z', null)).toBeNull()
    expect(diffMinutes(null, null)).toBeNull()
  })

  it('retorna null si alguna fecha es undefined', () => {
    expect(diffMinutes(undefined, '2024-01-15T10:00:00Z')).toBeNull()
  })

  it('calcula diferencia en minutos correctamente', () => {
    const a = '2024-01-15T10:00:00.000Z'
    const b = '2024-01-15T10:30:00.000Z'
    expect(diffMinutes(a, b)).toBe(30)
  })

  it('retorna negativo si b < a', () => {
    const a = '2024-01-15T10:30:00.000Z'
    const b = '2024-01-15T10:00:00.000Z'
    expect(diffMinutes(a, b)).toBe(-30)
  })
})

describe('pluralize', () => {
  it('retorna singular para count = 1', () => {
    expect(pluralize(1, 'pedido')).toBe('pedido')
  })

  it('retorna plural para count = 0', () => {
    expect(pluralize(0, 'pedido')).toBe('pedidos')
  })

  it('retorna plural para count > 1', () => {
    expect(pluralize(5, 'ítem', 'ítems')).toBe('ítems')
  })

  it('usa plural personalizado', () => {
    expect(pluralize(2, 'menú', 'menús')).toBe('menús')
  })
})

describe('getPublicImageUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna placeholder para null', () => {
    expect(getPublicImageUrl(null)).toBe('/placeholder-food.jpg')
  })

  it('retorna la URL directamente si ya es una URL completa', () => {
    const url = 'https://example.com/img/food.jpg'
    expect(getPublicImageUrl(url)).toBe(url)
  })

  it('llama a supabase storage para rutas relativas', () => {
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://mock.supabase.co/storage/v1/object/public/menu-images/food.jpg' },
    })
    const result = getPublicImageUrl('food.jpg')
    expect(mockGetPublicUrl).toHaveBeenCalledWith('food.jpg')
    expect(result).toBe('https://mock.supabase.co/storage/v1/object/public/menu-images/food.jpg')
  })
})
