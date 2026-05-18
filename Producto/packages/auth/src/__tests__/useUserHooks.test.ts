import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { Order, TableRecord } from '../types'

// Control mocks for the two sub-hooks that useRealtimeWaiterOrders depends on
const mockOrders = vi.hoisted(() => vi.fn<[], { orders: Order[]; loading: boolean; refetch: () => void }>())
const mockTables = vi.hoisted(() => vi.fn<[], { tables: TableRecord[]; loading: boolean; refetch: () => void }>())

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }), in: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn((cb) => { cb?.('SUBSCRIBED'); return {} }) })),
    removeChannel: vi.fn(),
    realtime: { setAuth: vi.fn() },
    storage: { from: vi.fn(() => ({ getPublicUrl: vi.fn() })) },
  })),
}))

vi.mock('../hooks/useOrderHooks', () => ({
  useRealtimeOrders: mockOrders,
}))

vi.mock('../hooks/useTableHooks', () => ({
  useTables: mockTables,
}))

import { useRealtimeWaiterOrders, useCustomerPortal, useCustomerOrderTracker } from '../hooks/useUserHooks'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    tableId: 'table-1',
    restaurantId: 'rest-1',
    userId: 'user-1',
    sessionId: 'sess-1',
    status: 'PENDING',
    notes: null,
    totalAmount: 5000,
    station: null,
    parentOrderId: null,
    barReady: false,
    kitchenReady: false,
    kitchenPreparing: false,
    barPreparing: false,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
    orderItems: [],
    ...overrides,
  }
}

function makeTable(overrides: Partial<TableRecord> = {}): TableRecord {
  return {
    id: 'table-1',
    number: 1,
    label: null,
    status: 'OCCUPIED',
    qrData: null,
    restaurantId: 'rest-1',
    billRequested: false,
    helpRequested: false,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockOrders.mockReturnValue({ orders: [], loading: false, refetch: vi.fn() })
  mockTables.mockReturnValue({ tables: [], loading: false, refetch: vi.fn() })
})

// ─── groupOrdersByTable (testeado vía useRealtimeWaiterOrders) ────────────────

describe('groupOrdersByTable — agrupación de sub-órdenes', () => {
  it('un solo pedido sin sub-órdenes permanece como estaba', () => {
    mockOrders.mockReturnValue({
      orders: [makeOrder({ status: 'PENDING' })],
      loading: false, refetch: vi.fn(),
    })
    const { result } = renderHook(() => useRealtimeWaiterOrders('rest-1'))
    expect(result.current.pendingOrders).toHaveLength(1)
    expect(result.current.pendingOrders[0].id).toBe('order-1')
  })

  it('dos sub-órdenes con mismo tableId se fusionan en un solo item', () => {
    mockOrders.mockReturnValue({
      orders: [
        makeOrder({ id: 'o-kitchen', tableId: 'table-1', status: 'PENDING', station: 'KITCHEN' }),
        makeOrder({ id: 'o-bar',     tableId: 'table-1', status: 'PENDING', station: 'BAR' }),
      ],
      loading: false, refetch: vi.fn(),
    })
    const { result } = renderHook(() => useRealtimeWaiterOrders('rest-1'))
    expect(result.current.pendingOrders).toHaveLength(1)
  })

  it('registra barSubOrderId y kitchenSubOrderId al fusionar', () => {
    mockOrders.mockReturnValue({
      orders: [
        makeOrder({ id: 'o-k', tableId: 'table-1', status: 'PENDING', station: 'KITCHEN' }),
        makeOrder({ id: 'o-b', tableId: 'table-1', status: 'PENDING', station: 'BAR' }),
      ],
      loading: false, refetch: vi.fn(),
    })
    const { result } = renderHook(() => useRealtimeWaiterOrders('rest-1'))
    const merged = result.current.pendingOrders[0] as any
    expect(merged.kitchenSubOrderId).toBe('o-k')
    expect(merged.barSubOrderId).toBe('o-b')
  })

  it('READY tiene prioridad sobre PREPARING al fusionar status', () => {
    mockOrders.mockReturnValue({
      orders: [
        makeOrder({ id: 'o-k', tableId: 'table-1', status: 'PREPARING', station: 'KITCHEN' }),
        makeOrder({ id: 'o-b', tableId: 'table-1', status: 'READY',     station: 'BAR' }),
      ],
      loading: false, refetch: vi.fn(),
    })
    const { result } = renderHook(() => useRealtimeWaiterOrders('rest-1'))
    expect(result.current.readyOrders).toHaveLength(1)
    expect(result.current.readyOrders[0].status).toBe('READY')
  })

  it('pedidos de distintas mesas NO se fusionan', () => {
    mockOrders.mockReturnValue({
      orders: [
        makeOrder({ id: 'o1', tableId: 'table-1', status: 'PENDING' }),
        makeOrder({ id: 'o2', tableId: 'table-2', status: 'PENDING' }),
      ],
      loading: false, refetch: vi.fn(),
    })
    const { result } = renderHook(() => useRealtimeWaiterOrders('rest-1'))
    expect(result.current.pendingOrders).toHaveLength(2)
  })

  it('los ítems de ambas sub-órdenes se combinan en orderItems', () => {
    const item1 = { id: 'i1', orderId: 'o-k', menuItemId: 'm1', restaurantId: 'rest-1', unitPrice: 1000, quantity: 1 }
    const item2 = { id: 'i2', orderId: 'o-b', menuItemId: 'm2', restaurantId: 'rest-1', unitPrice: 2000, quantity: 2 }
    mockOrders.mockReturnValue({
      orders: [
        makeOrder({ id: 'o-k', tableId: 'table-1', status: 'PENDING', station: 'KITCHEN', orderItems: [item1] }),
        makeOrder({ id: 'o-b', tableId: 'table-1', status: 'PENDING', station: 'BAR',     orderItems: [item2] }),
      ],
      loading: false, refetch: vi.fn(),
    })
    const { result } = renderHook(() => useRealtimeWaiterOrders('rest-1'))
    const merged = result.current.pendingOrders[0]
    expect(merged.orderItems).toHaveLength(2)
  })
})

describe('useRealtimeWaiterOrders — sets calculados', () => {
  it('billRequestedTableIds incluye mesas con bill_requested=true', () => {
    mockTables.mockReturnValue({
      tables: [makeTable({ id: 'table-2', billRequested: true })],
      loading: false, refetch: vi.fn(),
    })
    const { result } = renderHook(() => useRealtimeWaiterOrders('rest-1'))
    expect(result.current.billRequestedTableIds.has('table-2')).toBe(true)
  })

  it('helpRequestedTableIds incluye mesas con helpRequested=true', () => {
    mockTables.mockReturnValue({
      tables: [makeTable({ id: 'table-3', helpRequested: true })],
      loading: false, refetch: vi.fn(),
    })
    const { result } = renderHook(() => useRealtimeWaiterOrders('rest-1'))
    expect(result.current.helpRequestedTableIds.has('table-3')).toBe(true)
  })

  it('cleaningTables filtra solo mesas en CLEANING', () => {
    mockTables.mockReturnValue({
      tables: [
        makeTable({ id: 'table-1', status: 'OCCUPIED' }),
        makeTable({ id: 'table-4', status: 'CLEANING' }),
      ],
      loading: false, refetch: vi.fn(),
    })
    const { result } = renderHook(() => useRealtimeWaiterOrders('rest-1'))
    expect(result.current.cleaningTables).toHaveLength(1)
    expect(result.current.cleaningTables[0].id).toBe('table-4')
  })
})

// ─── useCustomerPortal ────────────────────────────────────────────────────────

describe('useCustomerPortal — carrito', () => {
  it('inicia con carrito vacío', () => {
    const { result } = renderHook(() => useCustomerPortal('rest-1'))
    expect(result.current.cartCount).toBe(0)
    expect(result.current.cartTotal).toBe(0)
  })

  it('addToCart agrega item al carrito', () => {
    const { result } = renderHook(() => useCustomerPortal('rest-1'))
    act(() => { result.current.addToCart({ id: 'item-1', name: 'Empanada', price: 1500 }) })
    expect(result.current.cartCount).toBe(1)
    expect(result.current.cartTotal).toBe(1500)
  })

  it('addToCart incrementa cantidad si el item ya está en carrito', () => {
    const { result } = renderHook(() => useCustomerPortal('rest-1'))
    act(() => { result.current.addToCart({ id: 'item-1', name: 'Empanada', price: 1500 }) })
    act(() => { result.current.addToCart({ id: 'item-1', name: 'Empanada', price: 1500 }) })
    expect(result.current.cartCount).toBe(2)
    expect(result.current.cartTotal).toBe(3000)
  })

  it('removeFromCart elimina item cuando cantidad llega a 0', () => {
    const { result } = renderHook(() => useCustomerPortal('rest-1'))
    act(() => { result.current.addToCart({ id: 'item-1', name: 'Empanada', price: 1500 }) })
    act(() => { result.current.removeFromCart('item-1') })
    expect(result.current.cartCount).toBe(0)
  })

  it('cartTotal suma correctamente múltiples items con distintas cantidades', () => {
    const { result } = renderHook(() => useCustomerPortal('rest-1'))
    act(() => {
      result.current.addToCart({ id: 'item-1', price: 2000 })
      result.current.addToCart({ id: 'item-1', price: 2000 })
      result.current.addToCart({ id: 'item-2', price: 3000 })
    })
    // 2×2000 + 1×3000 = 7000
    expect(result.current.cartTotal).toBe(7000)
    expect(result.current.cartCount).toBe(3)
  })

  it('placeOrder retorna false cuando el carrito está vacío', async () => {
    const { result } = renderHook(() => useCustomerPortal('rest-1'))
    let res: boolean = true
    await act(async () => { res = await result.current.placeOrder() })
    expect(res).toBe(false)
  })

  it('resetOrder limpia success, lastId y error', async () => {
    const { result } = renderHook(() => useCustomerPortal('rest-1'))
    act(() => { result.current.resetOrder() })
    expect(result.current.order.success).toBe(false)
    expect(result.current.order.lastId).toBeNull()
    expect(result.current.order.error).toBeNull()
  })
})

// ─── useCustomerOrderTracker ─────────────────────────────────────────────────

describe('useCustomerOrderTracker', () => {
  it('retorna status=null cuando orderId es null', async () => {
    const { result } = renderHook(() => useCustomerOrderTracker(null))
    await waitFor(() => expect(result.current.status).toBeNull())
  })

  it('expone status como propiedad', () => {
    const { result } = renderHook(() => useCustomerOrderTracker(null))
    expect('status' in result.current).toBe(true)
  })
})
