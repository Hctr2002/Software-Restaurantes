import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PendingOrderCard } from '../components/terminal/PendingOrderCard'

function makeOrder(overrides = {}) {
  return {
    id: 'order-1',
    status: 'PENDING',
    tableId: 'table-1',
    totalAmount: 5000,
    createdAt: new Date().toISOString(),
    table: { number: 4 },
    orderItems: [
      { id: 'i1', quantity: 2, menu_items: { name: 'Pasta' } },
      { id: 'i2', quantity: 1, menu_items: { name: 'Vino' } },
    ],
    barSubOrderId: null,
    ...overrides,
  }
}

const defaultProps = {
  note: '',
  barNote: '',
  processingId: null,
  savingNoteId: null,
  onNoteChange: vi.fn(),
  onSaveNote: vi.fn(),
  onValidate: vi.fn(),
  onReject: vi.fn(),
}

describe('PendingOrderCard — renderizado', () => {
  it('muestra el número de mesa', () => {
    render(<PendingOrderCard order={makeOrder()} {...defaultProps} />)
    expect(screen.getByText('Mesa 4')).toBeInTheDocument()
  })

  it('muestra — cuando no hay mesa', () => {
    render(<PendingOrderCard order={makeOrder({ table: null })} {...defaultProps} />)
    expect(screen.getByText('Mesa —')).toBeInTheDocument()
  })

  it('muestra el conteo de ítems', () => {
    render(<PendingOrderCard order={makeOrder()} {...defaultProps} />)
    expect(screen.getByText('2 ítem(s)')).toBeInTheDocument()
  })

  it('muestra los nombres de los ítems', () => {
    render(<PendingOrderCard order={makeOrder()} {...defaultProps} />)
    expect(screen.getByText('Pasta')).toBeInTheDocument()
    expect(screen.getByText('Vino')).toBeInTheDocument()
  })

  it('muestra badge PENDIENTE', () => {
    render(<PendingOrderCard order={makeOrder()} {...defaultProps} />)
    expect(screen.getByText('PENDIENTE')).toBeInTheDocument()
  })

  it('muestra botones Validar y Rechazar', () => {
    render(<PendingOrderCard order={makeOrder()} {...defaultProps} />)
    expect(screen.getByRole('button', { name: /validar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /rechazar/i })).toBeInTheDocument()
  })

  it('deshabilita botones cuando processingId coincide', () => {
    render(<PendingOrderCard order={makeOrder()} {...defaultProps} processingId="order-1" />)
    expect(screen.getByRole('button', { name: /validar/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /rechazar/i })).toBeDisabled()
  })

  it('muestra campo de nota de cocina', () => {
    render(<PendingOrderCard order={makeOrder()} {...defaultProps} />)
    expect(screen.getByPlaceholderText(/Sin sal/i)).toBeInTheDocument()
  })
})

describe('PendingOrderCard — callbacks', () => {
  it('llama onValidate con el pedido al hacer clic en Validar', () => {
    const onValidate = vi.fn()
    const order = makeOrder()
    render(<PendingOrderCard order={order} {...defaultProps} onValidate={onValidate} />)
    fireEvent.click(screen.getByRole('button', { name: /validar/i }))
    expect(onValidate).toHaveBeenCalledWith(order)
  })

  it('llama onReject con el pedido al hacer clic en Rechazar', () => {
    const onReject = vi.fn()
    const order = makeOrder()
    render(<PendingOrderCard order={order} {...defaultProps} onReject={onReject} />)
    fireEvent.click(screen.getByRole('button', { name: /rechazar/i }))
    expect(onReject).toHaveBeenCalledWith(order)
  })

  it('llama onNoteChange al escribir en el campo de nota', () => {
    const onNoteChange = vi.fn()
    render(<PendingOrderCard order={makeOrder()} {...defaultProps} onNoteChange={onNoteChange} />)
    fireEvent.change(screen.getByPlaceholderText(/Sin sal/i), { target: { value: 'Sin gluten' } })
    expect(onNoteChange).toHaveBeenCalledWith('order-1', 'Sin gluten')
  })

  it('llama onSaveNote al hacer clic en OK', () => {
    const onSaveNote = vi.fn()
    render(<PendingOrderCard order={makeOrder()} {...defaultProps} note="algo" onSaveNote={onSaveNote} />)
    fireEvent.click(screen.getByText('OK'))
    expect(onSaveNote).toHaveBeenCalledWith('order-1')
  })
})
