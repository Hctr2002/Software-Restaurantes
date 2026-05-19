import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PaymentSlideOver } from '../components/dashboard/PaymentSlideOver'
import type { TableGroup, Order } from '../components/dashboard/dashboardTypes'

function makeGroup(overrides: Partial<TableGroup> = {}): TableGroup {
  return {
    key: 'group-1',
    tableId: 'table-1',
    sessionId: null,
    tableNumber: 5,
    orders: [{
      id: 'o1',
      status: 'READY',
      tableId: 'table-1',
      orderItems: [
        { id: 'i1', quantity: 2, unitPrice: '3000', menuItem: { name: 'Pasta' } },
      ],
    }] as unknown as Order[],
    total: 6000,
    billRequested: false,
    tipIncluded: false,
    oldestCreatedAt: new Date().toISOString(),
    ...overrides,
  }
}

const defaultProps = {
  paymentReference: '',
  isProcessing: false,
  onPaymentRefChange: vi.fn(),
  onConfirm: vi.fn(),
  onClose: vi.fn(),
}

describe('PaymentSlideOver — renderizado', () => {
  it('muestra el número de mesa', () => {
    render(<PaymentSlideOver group={makeGroup()} {...defaultProps} />)
    expect(screen.getByText('Mesa 5')).toBeInTheDocument()
  })

  it('muestra "Mesa S/N" cuando tableNumber es null', () => {
    render(<PaymentSlideOver group={makeGroup({ tableNumber: null })} {...defaultProps} />)
    expect(screen.getByText('Mesa S/N')).toBeInTheDocument()
  })

  it('muestra el nombre del ítem', () => {
    render(<PaymentSlideOver group={makeGroup()} {...defaultProps} />)
    expect(screen.getByText('Pasta')).toBeInTheDocument()
  })

  it('muestra el campo de referencia de pago', () => {
    render(<PaymentSlideOver group={makeGroup()} {...defaultProps} />)
    expect(screen.getByLabelText('Referencia de Baucher / Pago')).toBeInTheDocument()
  })

  it('muestra botón Finalizar Pago', () => {
    render(<PaymentSlideOver group={makeGroup()} {...defaultProps} />)
    expect(screen.getByText(/Finalizar Pago/i)).toBeInTheDocument()
  })

  it('muestra badge CUENTA SOLICITADA cuando billRequested=true', () => {
    render(<PaymentSlideOver group={makeGroup({ billRequested: true })} {...defaultProps} />)
    expect(screen.getByText('CUENTA SOLICITADA')).toBeInTheDocument()
  })

  it('muestra propina cuando tipIncluded=true', () => {
    render(<PaymentSlideOver group={makeGroup({ tipIncluded: true })} {...defaultProps} />)
    expect(screen.getByText(/Propina/i)).toBeInTheDocument()
  })

  it('deshabilita botón cuando isProcessing=true', () => {
    render(<PaymentSlideOver group={makeGroup()} {...defaultProps} isProcessing />)
    // When processing, button shows spinner — query all buttons and find the disabled one
    const buttons = screen.getAllByRole('button')
    const disabledBtn = buttons.find(b => b.hasAttribute('disabled'))
    expect(disabledBtn).toBeTruthy()
  })
})

describe('PaymentSlideOver — callbacks', () => {
  it('llama onClose al hacer clic en Volver', () => {
    const onClose = vi.fn()
    render(<PaymentSlideOver group={makeGroup()} {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByText('Volver'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('llama onConfirm al hacer clic en Finalizar Pago', () => {
    const onConfirm = vi.fn()
    render(<PaymentSlideOver group={makeGroup()} {...defaultProps} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText(/Finalizar Pago/i))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('llama onPaymentRefChange al escribir', () => {
    const onPaymentRefChange = vi.fn()
    render(<PaymentSlideOver group={makeGroup()} {...defaultProps} onPaymentRefChange={onPaymentRefChange} />)
    fireEvent.change(screen.getByLabelText('Referencia de Baucher / Pago'), { target: { value: '#123' } })
    expect(onPaymentRefChange).toHaveBeenCalledWith('#123')
  })
})
