import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReadyOrdersBanner } from '../components/terminal/ReadyOrdersBanner'

function makeOrder(overrides = {}) {
  return {
    id: 'order-1',
    tableId: 'table-1',
    station: 'KITCHEN',
    table: { number: 3 },
    orderItems: [
      { id: 'i1', quantity: 2, menu_items: { name: 'Pizza' } },
    ],
    ...overrides,
  }
}

describe('ReadyOrdersBanner — renderizado', () => {
  it('no renderiza nada con lista vacía', () => {
    const { container } = render(<ReadyOrdersBanner orders={[]} onDeliver={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('muestra el encabezado con conteo de pedidos', () => {
    render(<ReadyOrdersBanner orders={[makeOrder()]} onDeliver={vi.fn()} />)
    expect(screen.getByText(/Listos para servir \(1\)/i)).toBeInTheDocument()
  })

  it('muestra el número de mesa', () => {
    render(<ReadyOrdersBanner orders={[makeOrder()]} onDeliver={vi.fn()} />)
    expect(screen.getByText('Mesa 3')).toBeInTheDocument()
  })

  it('muestra — cuando no hay mesa', () => {
    render(<ReadyOrdersBanner orders={[makeOrder({ table: null })]} onDeliver={vi.fn()} />)
    expect(screen.getByText('Mesa —')).toBeInTheDocument()
  })

  it('muestra nombre del ítem', () => {
    render(<ReadyOrdersBanner orders={[makeOrder()]} onDeliver={vi.fn()} />)
    expect(screen.getByText(/2x Pizza/)).toBeInTheDocument()
  })

  it('muestra badge Cocina para station=KITCHEN', () => {
    render(<ReadyOrdersBanner orders={[makeOrder({ station: 'KITCHEN' })]} onDeliver={vi.fn()} />)
    expect(screen.getByText('Cocina')).toBeInTheDocument()
  })

  it('muestra badge Bar para station=BAR', () => {
    render(<ReadyOrdersBanner orders={[makeOrder({ station: 'BAR' })]} onDeliver={vi.fn()} />)
    expect(screen.getByText('Bar')).toBeInTheDocument()
  })

  it('muestra múltiples pedidos', () => {
    const orders = [
      makeOrder({ id: 'o1', table: { number: 1 } }),
      makeOrder({ id: 'o2', table: { number: 2 } }),
    ]
    render(<ReadyOrdersBanner orders={orders} onDeliver={vi.fn()} />)
    expect(screen.getByText(/Listos para servir \(2\)/i)).toBeInTheDocument()
    expect(screen.getByText('Mesa 1')).toBeInTheDocument()
    expect(screen.getByText('Mesa 2')).toBeInTheDocument()
  })

  it('muestra botón Entregar Pedido', () => {
    render(<ReadyOrdersBanner orders={[makeOrder()]} onDeliver={vi.fn()} />)
    expect(screen.getByText('Entregar Pedido')).toBeInTheDocument()
  })
})

describe('ReadyOrdersBanner — callbacks', () => {
  it('llama onDeliver con el id y el pedido', () => {
    const onDeliver = vi.fn()
    const order = makeOrder()
    render(<ReadyOrdersBanner orders={[order]} onDeliver={onDeliver} />)
    fireEvent.click(screen.getByText('Entregar Pedido'))
    expect(onDeliver).toHaveBeenCalledWith('order-1', order)
  })

  it('muestra indicador ...y N más cuando hay más de 3 ítems', () => {
    const order = makeOrder({
      orderItems: [
        { id: 'i1', quantity: 1, menu_items: { name: 'A' } },
        { id: 'i2', quantity: 1, menu_items: { name: 'B' } },
        { id: 'i3', quantity: 1, menu_items: { name: 'C' } },
        { id: 'i4', quantity: 1, menu_items: { name: 'D' } },
      ],
    })
    render(<ReadyOrdersBanner orders={[order]} onDeliver={vi.fn()} />)
    expect(screen.getByText(/\.\.\.y 1 más/)).toBeInTheDocument()
  })
})
