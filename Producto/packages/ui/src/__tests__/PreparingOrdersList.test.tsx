import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PreparingOrdersList } from '../components/terminal/PreparingOrdersList'
import type { Order } from '../components/dashboard/dashboardTypes'

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    status: 'PREPARING',
    tableId: 'table-1',
    table: { number: 4, id: 'table-1', status: 'OCCUPIED', restaurantId: 'r1' },
    createdAt: new Date().toISOString(),
    orderItems: [
      { id: 'i1', quantity: 2, menuItem: { name: 'Lomo' } },
    ],
    restaurantId: 'r1',
    ...overrides,
  } as unknown as Order
}

describe('PreparingOrdersList — sin pedidos', () => {
  it('no renderiza nada cuando la lista está vacía', () => {
    const { container } = render(<PreparingOrdersList orders={[]} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('PreparingOrdersList — con pedidos', () => {
  it('muestra el encabezado con conteo', () => {
    render(<PreparingOrdersList orders={[makeOrder()]} />)
    expect(screen.getByText(/En Preparación \(1\)/)).toBeInTheDocument()
  })

  it('muestra el número de mesa', () => {
    render(<PreparingOrdersList orders={[makeOrder()]} />)
    expect(screen.getByText('Mesa 4')).toBeInTheDocument()
  })

  it('muestra — cuando no hay mesa', () => {
    render(<PreparingOrdersList orders={[makeOrder({ table: null })]} />)
    expect(screen.getByText('Mesa —')).toBeInTheDocument()
  })

  it('muestra badge PREPARANDO para status=PREPARING', () => {
    render(<PreparingOrdersList orders={[makeOrder({ status: 'PREPARING' as any })]} />)
    expect(screen.getByText('PREPARANDO')).toBeInTheDocument()
  })

  it('muestra badge EN COLA para status diferente de PREPARING', () => {
    render(<PreparingOrdersList orders={[makeOrder({ status: 'VALIDATED' as any })]} />)
    expect(screen.getByText('EN COLA')).toBeInTheDocument()
  })

  it('muestra nombre del ítem', () => {
    render(<PreparingOrdersList orders={[makeOrder()]} />)
    expect(screen.getByText('Lomo')).toBeInTheDocument()
  })

  it('muestra conteo de ítems en el header de la tarjeta', () => {
    render(<PreparingOrdersList orders={[makeOrder()]} />)
    expect(screen.getByText('1 ítem(s)')).toBeInTheDocument()
  })

  it('muestra múltiples pedidos', () => {
    const orders = [
      makeOrder({ id: 'o1', table: { number: 1 } as any }),
      makeOrder({ id: 'o2', table: { number: 2 } as any }),
    ]
    render(<PreparingOrdersList orders={orders} />)
    expect(screen.getByText(/En Preparación \(2\)/)).toBeInTheDocument()
    expect(screen.getByText('Mesa 1')).toBeInTheDocument()
    expect(screen.getByText('Mesa 2')).toBeInTheDocument()
  })
})
