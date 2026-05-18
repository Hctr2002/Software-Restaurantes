import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OrderTicket } from '../components/OrderTicket'

function makeItem(overrides = {}) {
  return {
    id: `item-${Math.random()}`,
    quantity: 2,
    notes: null,
    menuItem: { name: 'Empanada' },
    menu_items: { name: 'Empanada' },
    ...overrides,
  }
}

const baseProps = {
  id: 'order-abc-1234',
  tableNumber: 5,
  status: 'PENDING' as const,
  createdAt: new Date().toISOString(),
  items: [makeItem()],
  onStatusChange: vi.fn(),
}

describe('OrderTicket — renderizado', () => {
  it('muestra el número de mesa', () => {
    render(<OrderTicket {...baseProps} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('muestra ? cuando tableNumber es null', () => {
    render(<OrderTicket {...baseProps} tableNumber={null} />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('muestra el nombre del ítem', () => {
    render(<OrderTicket {...baseProps} />)
    expect(screen.getByText('Empanada')).toBeInTheDocument()
  })

  it('muestra la cantidad del ítem', () => {
    render(<OrderTicket {...baseProps} items={[makeItem({ quantity: 3 })]} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('muestra el botón Comenzar cuando status=PENDING', () => {
    render(<OrderTicket {...baseProps} status="PENDING" />)
    expect(screen.getByText('Comenzar')).toBeInTheDocument()
  })

  it('muestra el botón Comenzar cuando status=VALIDATED', () => {
    render(<OrderTicket {...baseProps} status="VALIDATED" />)
    expect(screen.getByText('Comenzar')).toBeInTheDocument()
  })

  it('muestra el botón Terminar cuando status=PREPARING', () => {
    render(<OrderTicket {...baseProps} status="PREPARING" />)
    expect(screen.getByText('Terminar')).toBeInTheDocument()
  })

  it('muestra Listo cuando status=READY', () => {
    render(<OrderTicket {...baseProps} status="READY" />)
    expect(screen.getByText('Listo')).toBeInTheDocument()
  })

  it('muestra notas cuando se proporcionan', () => {
    render(<OrderTicket {...baseProps} notes="Sin sal" />)
    expect(screen.getByText('Sin sal')).toBeInTheDocument()
  })

  it('no muestra sección de notas cuando notes es null', () => {
    render(<OrderTicket {...baseProps} notes={null} />)
    expect(screen.queryByText('Notas del Pedido')).not.toBeInTheDocument()
  })

  it('muestra el tiempo transcurrido en minutos', () => {
    render(<OrderTicket {...baseProps} />)
    expect(screen.getByText(/\dm/)).toBeInTheDocument()
  })
})

describe('OrderTicket — callbacks', () => {
  it('llama onStatusChange con PREPARING al hacer clic en Comenzar', () => {
    const onStatusChange = vi.fn()
    render(<OrderTicket {...baseProps} status="PENDING" onStatusChange={onStatusChange} />)
    fireEvent.click(screen.getByText('Comenzar'))
    expect(onStatusChange).toHaveBeenCalledWith('PREPARING')
  })

  it('llama onStatusChange con READY al hacer clic en Terminar', () => {
    const onStatusChange = vi.fn()
    render(<OrderTicket {...baseProps} status="PREPARING" onStatusChange={onStatusChange} />)
    fireEvent.click(screen.getByText('Terminar'))
    expect(onStatusChange).toHaveBeenCalledWith('READY')
  })

  it('llama onDismiss al hacer clic en el botón X cuando status=READY', () => {
    const onDismiss = vi.fn()
    render(<OrderTicket {...baseProps} status="READY" onDismiss={onDismiss} />)
    const dismissBtn = screen.getByTitle('Retirar de la cola')
    fireEvent.click(dismissBtn)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})

describe('OrderTicket — tipo BAR', () => {
  it('renderiza sin error con type=BAR', () => {
    render(<OrderTicket {...baseProps} type="BAR" />)
    expect(screen.getByText('Empanada')).toBeInTheDocument()
  })
})
