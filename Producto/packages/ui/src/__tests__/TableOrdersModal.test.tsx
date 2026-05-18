import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TableOrdersModal } from '../components/terminal/TableOrdersModal'
import type { TableRecord, Order } from '@menu-bites/auth'

function makeTable(overrides: Partial<TableRecord> = {}): TableRecord {
  return {
    id: 'table-1',
    number: 4,
    label: null,
    status: 'OCCUPIED',
    qrData: null,
    restaurantId: 'r1',
    billRequested: false,
    helpRequested: false,
    ...overrides,
  } as TableRecord
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    status: 'PREPARING',
    tableId: 'table-1',
    totalAmount: 5000,
    createdAt: new Date().toISOString(),
    orderItems: [
      { id: 'i1', quantity: 2, menuItem: { name: 'Pizza' }, menu_items: { name: 'Pizza' } },
    ],
    restaurantId: 'r1',
    ...overrides,
  } as unknown as Order
}

const defaultProps = {
  onClose: vi.fn(),
  onTakeOrder: vi.fn(),
}

describe('TableOrdersModal — cerrado', () => {
  it('no renderiza cuando isOpen=false', () => {
    const { container } = render(
      <TableOrdersModal isOpen={false} table={makeTable()} orders={[]} {...defaultProps} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('no renderiza cuando table=null', () => {
    const { container } = render(
      <TableOrdersModal isOpen table={null} orders={[]} {...defaultProps} />
    )
    expect(container.firstChild).toBeNull()
  })
})

describe('TableOrdersModal — abierto', () => {
  it('muestra el número de mesa', () => {
    render(<TableOrdersModal isOpen table={makeTable()} orders={[makeOrder()]} {...defaultProps} />)
    expect(screen.getByText('Mesa 4')).toBeInTheDocument()
  })

  it('muestra conteo de pedidos en curso', () => {
    render(<TableOrdersModal isOpen table={makeTable()} orders={[makeOrder()]} {...defaultProps} />)
    expect(screen.getByText(/1 Pedido\(s\) en curso/i)).toBeInTheDocument()
  })

  it('muestra "Sin pedidos activos" cuando no hay pedidos para la mesa', () => {
    render(
      <TableOrdersModal
        isOpen
        table={makeTable({ id: 'table-99' })}
        orders={[makeOrder({ tableId: 'table-1' })]}
        {...defaultProps}
      />
    )
    expect(screen.getByText('Sin pedidos activos')).toBeInTheDocument()
  })

  it('muestra los ítems del pedido', () => {
    render(<TableOrdersModal isOpen table={makeTable()} orders={[makeOrder()]} {...defaultProps} />)
    expect(screen.getByText('Pizza')).toBeInTheDocument()
  })

  it('muestra el badge de estado del pedido', () => {
    render(<TableOrdersModal isOpen table={makeTable()} orders={[makeOrder({ status: 'PREPARING' as any })]} {...defaultProps} />)
    expect(screen.getByText('PREPARANDO')).toBeInTheDocument()
  })
})

describe('TableOrdersModal — callbacks', () => {
  it('llama onClose al hacer clic en el botón X', () => {
    const onClose = vi.fn()
    render(<TableOrdersModal isOpen table={makeTable()} orders={[]} {...defaultProps} onClose={onClose} />)
    const xButton = screen.getAllByRole('button').find(b => !b.textContent?.trim())
    if (xButton) fireEvent.click(xButton)
    expect(onClose).toHaveBeenCalled()
  })
})
