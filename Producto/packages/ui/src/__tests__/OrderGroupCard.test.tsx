import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OrderGroupCard, groupOrders, orderTotal } from '../components/dashboard/OrderGroupCard'
import type { TableGroup, Order } from '../components/dashboard/dashboardTypes'

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    status: 'READY',
    tableId: 'table-1',
    sessionId: null,
    createdAt: new Date().toISOString(),
    table: { number: 3, id: 'table-1', status: 'OCCUPIED', restaurantId: 'r1' },
    orderItems: [
      { id: 'i1', quantity: 2, unitPrice: '3000', menuItem: { name: 'Pizza' } },
    ],
    restaurantId: 'r1',
    ...overrides,
  } as unknown as Order
}

function makeGroup(overrides: Partial<TableGroup> = {}): TableGroup {
  return {
    key: 'group-1',
    tableId: 'table-1',
    sessionId: null,
    tableNumber: 3,
    orders: [makeOrder()],
    total: 6000,
    billRequested: false,
    tipIncluded: false,
    oldestCreatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('OrderGroupCard — renderizado', () => {
  it('muestra el número de mesa', () => {
    render(<OrderGroupCard group={makeGroup()} index={0} isPending onClick={vi.fn()} />)
    expect(screen.getByText('Mesa 3')).toBeInTheDocument()
  })

  it('muestra "Mesas fusionadas" cuando hay sessionId', () => {
    render(<OrderGroupCard group={makeGroup({ sessionId: 'session-1' })} index={0} isPending onClick={vi.fn()} />)
    expect(screen.getByText('Mesas fusionadas')).toBeInTheDocument()
  })

  it('muestra el total a cobrar', () => {
    render(<OrderGroupCard group={makeGroup({ total: 6000 })} index={0} isPending onClick={vi.fn()} />)
    expect(screen.getByText('Total a Cobrar')).toBeInTheDocument()
  })

  it('muestra botón Procesar Pago cuando isPending=true', () => {
    render(<OrderGroupCard group={makeGroup()} index={0} isPending onClick={vi.fn()} />)
    expect(screen.getByText(/Procesar Pago/i)).toBeInTheDocument()
  })

  it('muestra Pagado cuando isPending=false', () => {
    render(<OrderGroupCard group={makeGroup()} index={0} isPending={false} onClick={vi.fn()} />)
    expect(screen.getByText('Pagado')).toBeInTheDocument()
  })

  it('muestra badge CUENTA cuando billRequested=true', () => {
    render(<OrderGroupCard group={makeGroup({ billRequested: true })} index={0} isPending onClick={vi.fn()} />)
    expect(screen.getByText('CUENTA')).toBeInTheDocument()
  })

  it('no muestra badge CUENTA cuando billRequested=false', () => {
    render(<OrderGroupCard group={makeGroup({ billRequested: false })} index={0} isPending onClick={vi.fn()} />)
    expect(screen.queryByText('CUENTA')).not.toBeInTheDocument()
  })

  it('muestra nombre del ítem del pedido', () => {
    render(<OrderGroupCard group={makeGroup()} index={0} isPending onClick={vi.fn()} />)
    expect(screen.getByText('Pizza')).toBeInTheDocument()
  })

  it('muestra indicador de ítems extra cuando hay más de 4', () => {
    const order = makeOrder({
      orderItems: [1, 2, 3, 4, 5].map((n) => ({ id: `i${n}`, quantity: 1, unitPrice: '1000', menuItem: { name: `Item ${n}` } })),
    } as any)
    render(<OrderGroupCard group={makeGroup({ orders: [order] })} index={0} isPending onClick={vi.fn()} />)
    expect(screen.getByText(/ítems adicionales/)).toBeInTheDocument()
  })
})

describe('OrderGroupCard — callbacks', () => {
  it('llama onClick al hacer clic en la tarjeta', () => {
    const onClick = vi.fn()
    render(<OrderGroupCard group={makeGroup()} index={0} isPending onClick={onClick} />)
    fireEvent.click(screen.getByText('Mesa 3').closest('[class*="bg-card"]') as Element)
    expect(onClick).toHaveBeenCalled()
  })
})

describe('orderTotal', () => {
  it('calcula el total correctamente', () => {
    const order = makeOrder({
      orderItems: [
        { id: 'i1', quantity: 2, unitPrice: '3000' },
        { id: 'i2', quantity: 1, unitPrice: '1000' },
      ],
    } as any)
    expect(orderTotal(order)).toBe(7000)
  })

  it('retorna 0 cuando no hay orderItems', () => {
    const order = makeOrder({ orderItems: undefined } as any)
    expect(orderTotal(order)).toBe(0)
  })
})

describe('groupOrders', () => {
  it('agrupa por tableId', () => {
    const orders = [
      makeOrder({ id: 'o1', tableId: 'table-1', sessionId: null }),
      makeOrder({ id: 'o2', tableId: 'table-1', sessionId: null }),
    ]
    const groups = groupOrders(orders, {})
    expect(groups.length).toBe(1)
    expect(groups[0].orders.length).toBe(2)
  })

  it('separa pedidos de tablas distintas', () => {
    const orders = [
      makeOrder({ id: 'o1', tableId: 'table-1', sessionId: null, table: { number: 1 } as any }),
      makeOrder({ id: 'o2', tableId: 'table-2', sessionId: null, table: { number: 2 } as any }),
    ]
    const groups = groupOrders(orders, {})
    expect(groups.length).toBe(2)
  })

  it('aplica billRequested del billMap', () => {
    const orders = [makeOrder({ tableId: 'table-1' })]
    const groups = groupOrders(orders, { 'table-1': true })
    expect(groups[0].billRequested).toBe(true)
  })

  it('suma el total de los pedidos del grupo', () => {
    const orders = [
      makeOrder({ id: 'o1', tableId: 'table-1', orderItems: [{ id: 'i1', quantity: 2, unitPrice: '1000' }] as any }),
      makeOrder({ id: 'o2', tableId: 'table-1', orderItems: [{ id: 'i2', quantity: 1, unitPrice: '2000' }] as any }),
    ]
    const groups = groupOrders(orders, {})
    expect(groups[0].total).toBe(4000)
  })
})
