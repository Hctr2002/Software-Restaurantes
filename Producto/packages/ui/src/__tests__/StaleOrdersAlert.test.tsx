import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StaleOrdersAlert } from '../components/dashboard/StaleOrdersAlert'
import type { Order } from '../components/dashboard/dashboardTypes'

function makeOrder(minutesOld: number, overrides: Partial<Order> = {}): Order {
  const createdAt = new Date(Date.now() - minutesOld * 60 * 1000).toISOString()
  return {
    id: 'order-1',
    status: 'PENDING',
    tableId: 'table-1',
    table: { number: 3, id: 'table-1', status: 'OCCUPIED', restaurantId: 'r1' },
    createdAt,
    orderItems: [],
    restaurantId: 'r1',
    ...overrides,
  } as unknown as Order
}

describe('StaleOrdersAlert — sin pedidos estancados', () => {
  it('no renderiza nada cuando no hay pedidos', () => {
    const { container } = render(<StaleOrdersAlert orders={[]} staleMinutes={15} />)
    expect(container.firstChild).toBeNull()
  })

  it('no renderiza cuando pedidos son recientes', () => {
    const { container } = render(
      <StaleOrdersAlert orders={[makeOrder(5)]} staleMinutes={15} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('no renderiza pedidos no-PENDING aunque sean viejos', () => {
    const { container } = render(
      <StaleOrdersAlert orders={[makeOrder(30, { status: 'PREPARING' } as any)]} staleMinutes={15} />
    )
    expect(container.firstChild).toBeNull()
  })
})

describe('StaleOrdersAlert — con pedidos estancados', () => {
  it('muestra alerta cuando hay pedido PENDING antiguo', () => {
    render(<StaleOrdersAlert orders={[makeOrder(20)]} staleMinutes={15} />)
    expect(screen.getByText(/pedido.*sin validar/i)).toBeInTheDocument()
  })

  it('muestra el número de minutos configurado', () => {
    render(<StaleOrdersAlert orders={[makeOrder(20)]} staleMinutes={15} />)
    expect(screen.getByText(/15 minutos/)).toBeInTheDocument()
  })

  it('muestra el número de mesa del pedido estancado', () => {
    render(<StaleOrdersAlert orders={[makeOrder(20)]} staleMinutes={15} />)
    expect(screen.getByText(/Mesa 3/)).toBeInTheDocument()
  })

  it('muestra plural "pedidos" cuando hay más de 1', () => {
    const orders = [
      makeOrder(20, { id: 'o1' }),
      makeOrder(25, { id: 'o2', table: { number: 5 } as any }),
    ]
    render(<StaleOrdersAlert orders={orders} staleMinutes={15} />)
    expect(screen.getByText(/2 pedidos/)).toBeInTheDocument()
  })
})
