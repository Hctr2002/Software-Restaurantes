import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OrderActivityFeed } from '../components/dashboard/OrderActivityFeed'
import { TableStatusBoard } from '../components/dashboard/TableStatusBoard'
import type { Order } from '../components/dashboard/dashboardTypes'

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o1',
    status: 'PREPARING',
    tableId: 'table-1',
    table: { number: 3, id: 'table-1', status: 'OCCUPIED', restaurantId: 'r1' },
    createdAt: new Date().toISOString(),
    orderItems: [],
    restaurantId: 'r1',
    ...overrides,
  } as unknown as Order
}

describe('OrderActivityFeed — renderizado', () => {
  it('muestra el título "Top Items Hoy"', () => {
    render(<OrderActivityFeed orders={[]} topItems={[]} />)
    expect(screen.getByText('Top Items Hoy')).toBeInTheDocument()
  })

  it('muestra el título "Últimos Pedidos"', () => {
    render(<OrderActivityFeed orders={[]} topItems={[]} />)
    expect(screen.getByText('Últimos Pedidos')).toBeInTheDocument()
  })

  it('muestra "Sin pedidos hoy" cuando topItems está vacío', () => {
    render(<OrderActivityFeed orders={[]} topItems={[]} />)
    expect(screen.getByText('Sin pedidos hoy.')).toBeInTheDocument()
  })

  it('muestra "No hay pedidos registrados" cuando orders está vacío', () => {
    render(<OrderActivityFeed orders={[]} topItems={[]} />)
    expect(screen.getByText('No hay pedidos registrados.')).toBeInTheDocument()
  })

  it('muestra los top items cuando se proporcionan', () => {
    const topItems = [{ name: 'Lomo Saltado', count: 5 }]
    render(<OrderActivityFeed orders={[]} topItems={topItems} />)
    expect(screen.getByText('Lomo Saltado')).toBeInTheDocument()
    expect(screen.getByText('5 Unid.')).toBeInTheDocument()
  })

  it('muestra pedidos recientes', () => {
    const orders = [makeOrder({ table: { number: 7 } as any })]
    render(<OrderActivityFeed orders={orders} topItems={[]} />)
    expect(screen.getByText('Mesa 7')).toBeInTheDocument()
  })

  it('muestra badge de estado del pedido', () => {
    const orders = [makeOrder({ status: 'PENDING' as any })]
    render(<OrderActivityFeed orders={orders} topItems={[]} />)
    expect(screen.getByText('PENDING')).toBeInTheDocument()
  })
})

describe('TableStatusBoard — renderizado', () => {
  it('muestra el título Estado de Mesas', () => {
    render(<TableStatusBoard tables={[]} />)
    expect(screen.getByText('Estado de Mesas')).toBeInTheDocument()
  })

  it('muestra "No hay mesas registradas" cuando la lista está vacía', () => {
    render(<TableStatusBoard tables={[]} />)
    expect(screen.getByText('No hay mesas registradas.')).toBeInTheDocument()
  })

  it('muestra número de mesa', () => {
    render(<TableStatusBoard tables={[{ id: 't1', number: 5, status: 'FREE' }]} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('muestra Libre para status FREE', () => {
    render(<TableStatusBoard tables={[{ id: 't1', number: 1, status: 'FREE' }]} />)
    expect(screen.getByText('Libre')).toBeInTheDocument()
  })

  it('muestra Uso para status OCCUPIED', () => {
    render(<TableStatusBoard tables={[{ id: 't1', number: 2, status: 'OCCUPIED' }]} />)
    expect(screen.getByText('Uso')).toBeInTheDocument()
  })

  it('muestra Limpieza para status CLEANING', () => {
    render(<TableStatusBoard tables={[{ id: 't1', number: 3, status: 'CLEANING' }]} />)
    expect(screen.getByText('Limpieza')).toBeInTheDocument()
  })

  it('muestra Resv para status RESERVED', () => {
    render(<TableStatusBoard tables={[{ id: 't1', number: 4, status: 'RESERVED' }]} />)
    expect(screen.getByText('Resv')).toBeInTheDocument()
  })
})
