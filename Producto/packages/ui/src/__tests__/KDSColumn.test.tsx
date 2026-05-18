import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KDSColumn } from '../components/dashboard/KDSColumn'
import { TicketWrapper } from '../components/dashboard/TicketWrapper'

describe('KDSColumn — renderizado', () => {
  it('muestra el título de la columna', () => {
    render(<KDSColumn title="Cocina" count={3}><div /></KDSColumn>)
    expect(screen.getByText('Cocina')).toBeInTheDocument()
  })

  it('muestra el conteo de tickets', () => {
    render(<KDSColumn title="Bar" count={5}><div /></KDSColumn>)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('muestra "Sin actividad" cuando count=0', () => {
    render(<KDSColumn title="Cocina" count={0}><div /></KDSColumn>)
    expect(screen.getByText('Sin actividad')).toBeInTheDocument()
  })

  it('no muestra "Sin actividad" cuando count>0', () => {
    render(<KDSColumn title="Cocina" count={2}><div /></KDSColumn>)
    expect(screen.queryByText('Sin actividad')).not.toBeInTheDocument()
  })

  it('renderiza children', () => {
    render(
      <KDSColumn title="Test" count={1}>
        <div data-testid="ticket">Ticket 1</div>
      </KDSColumn>
    )
    expect(screen.getByTestId('ticket')).toBeInTheDocument()
  })
})

describe('TicketWrapper — renderizado', () => {
  const props = {
    createdAt: new Date().toISOString(),
    thresholds: { yellow: 10, red: 20 },
    status: 'PREPARING',
  }

  it('renderiza children', () => {
    render(
      <TicketWrapper {...props}>
        <div data-testid="content">Ticket Content</div>
      </TicketWrapper>
    )
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('aplica ring verde cuando status=READY', () => {
    const { container } = render(
      <TicketWrapper {...props} status="READY">
        <div>Ready</div>
      </TicketWrapper>
    )
    expect(container.querySelector('.ring-emerald-500\\/30')).toBeInTheDocument()
  })

  it('aplica ring verde cuando pedido es reciente', () => {
    const { container } = render(
      <TicketWrapper {...props}>
        <div>Reciente</div>
      </TicketWrapper>
    )
    expect(container.querySelector('[class*="ring"]')).toBeInTheDocument()
  })
})
