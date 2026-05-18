import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OrderTracker } from '../components/portal/OrderTracker'

describe('OrderTracker — renderizado de pasos', () => {
  it('muestra todos los pasos del ciclo', () => {
    render(<OrderTracker status="PENDING" />)
    expect(screen.getByText('Solicitado')).toBeInTheDocument()
    expect(screen.getByText('Confirmado')).toBeInTheDocument()
    expect(screen.getByText('En preparación')).toBeInTheDocument()
    expect(screen.getByText('Listo')).toBeInTheDocument()
  })

  it('muestra ¡Listo! cuando status=READY', () => {
    render(<OrderTracker status="READY" />)
    expect(screen.getByText('¡Listo!')).toBeInTheDocument()
  })

  it('no muestra ¡Listo! cuando status no es READY', () => {
    render(<OrderTracker status="PENDING" />)
    expect(screen.queryByText('¡Listo!')).not.toBeInTheDocument()
  })

  it('renderiza sin error para status=VALIDATED', () => {
    render(<OrderTracker status="VALIDATED" />)
    expect(screen.getByText('Confirmado')).toBeInTheDocument()
  })

  it('renderiza sin error para status=PREPARING', () => {
    render(<OrderTracker status="PREPARING" />)
    expect(screen.getByText('En preparación')).toBeInTheDocument()
  })

  it('renderiza sin error para status desconocido', () => {
    render(<OrderTracker status="UNKNOWN" />)
    expect(screen.getByText('Solicitado')).toBeInTheDocument()
  })
})
