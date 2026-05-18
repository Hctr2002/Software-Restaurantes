import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CuentaSheet } from '../components/portal/CuentaSheet'
import type { Order } from '@menu-bites/auth'

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    status: 'PREPARING',
    tableId: 'table-1',
    tableNumber: 3,
    createdAt: new Date().toISOString(),
    orderItems: [
      { id: 'i1', quantity: 2, unitPrice: '3000', menuItem: { name: 'Pasta' } },
    ],
    restaurantId: 'r1',
    ...overrides,
  } as unknown as Order
}

describe('CuentaSheet — renderizado', () => {
  it('muestra el encabezado Mi Cuenta', () => {
    render(<CuentaSheet tableLabel="5" orders={[]} onClose={vi.fn()} />)
    expect(screen.getByText('Mi Cuenta')).toBeInTheDocument()
  })

  it('muestra el label de la mesa en el subtítulo', () => {
    render(<CuentaSheet tableLabel="7" orders={[]} onClose={vi.fn()} />)
    expect(screen.getByText(/Mesa 7/)).toBeInTheDocument()
  })

  it('muestra mensaje vacío cuando no hay pedidos', () => {
    render(<CuentaSheet tableLabel="1" orders={[]} onClose={vi.fn()} />)
    expect(screen.getByText(/No hay pedidos activos/i)).toBeInTheDocument()
  })

  it('muestra los ítems del pedido', () => {
    render(<CuentaSheet tableLabel="3" orders={[makeOrder()]} onClose={vi.fn()} />)
    expect(screen.getByText('Pasta')).toBeInTheDocument()
  })

  it('muestra el grupo de mesa para el pedido', () => {
    render(<CuentaSheet tableLabel="3" orders={[makeOrder({ tableNumber: 3 })]} onClose={vi.fn()} />)
    expect(screen.getByText('Mesa 3')).toBeInTheDocument()
  })

  it('muestra "Sin Mesa" cuando tableNumber es null', () => {
    render(<CuentaSheet tableLabel="–" orders={[makeOrder({ tableNumber: null } as any)]} onClose={vi.fn()} />)
    expect(screen.getByText('Sin Mesa')).toBeInTheDocument()
  })
})

describe('CuentaSheet — callbacks', () => {
  it('llama onClose al hacer clic en el botón X', () => {
    const onClose = vi.fn()
    render(<CuentaSheet tableLabel="3" orders={[]} onClose={onClose} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
