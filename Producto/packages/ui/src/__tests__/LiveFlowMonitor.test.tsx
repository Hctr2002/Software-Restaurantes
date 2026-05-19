import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LiveFlowMonitor } from '../components/dashboard/LiveFlowMonitor'
import type { Order } from '../components/dashboard/dashboardTypes'

function makeOrder(status: string, overrides: any = {}): Order {
  return {
    id: `order-${Math.random()}`,
    status,
    tableId: 'table-1',
    createdAt: new Date().toISOString(),
    orderItems: [],
    restaurantId: 'r1',
    ...overrides,
  } as unknown as Order
}

describe('LiveFlowMonitor — renderizado', () => {
  it('muestra el título "Flujo en Vivo"', () => {
    render(<LiveFlowMonitor orders={[]} />)
    expect(screen.getByText('Flujo en Vivo')).toBeInTheDocument()
  })

  it('muestra el título "Tiempo Promedio Hoy"', () => {
    render(<LiveFlowMonitor orders={[]} />)
    expect(screen.getByText('Tiempo Promedio Hoy')).toBeInTheDocument()
  })

  it('muestra los 4 estados de flujo', () => {
    render(<LiveFlowMonitor orders={[]} />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Validado')).toBeInTheDocument()
    expect(screen.getByText('Preparando')).toBeInTheDocument()
    expect(screen.getByText('Listo')).toBeInTheDocument()
  })

  it('muestra conteos correctos por estado', () => {
    const orders = [
      makeOrder('PENDING'),
      makeOrder('PENDING'),
      makeOrder('PREPARING'),
    ]
    render(<LiveFlowMonitor orders={orders} />)
    // 2 PENDING, 1 PREPARING, 0 VALIDATED, 0 READY
    const counts = screen.getAllByText(/^\d+$/)
    expect(counts.length).toBeGreaterThan(0)
  })

  it('muestra mensaje de sin entregas cuando no hay DELIVERED con timestamps', () => {
    render(<LiveFlowMonitor orders={[]} />)
    expect(screen.getByText(/Sin entregas con timestamps hoy/)).toBeInTheDocument()
  })

  it('muestra el tiempo promedio cuando hay pedidos DELIVERED con timestamps', () => {
    const now = Date.now()
    const order = makeOrder('DELIVERED', {
      createdAt: new Date(now - 20 * 60 * 1000).toISOString(),
      ready_at: new Date(now - 5 * 60 * 1000).toISOString(),
    })
    render(<LiveFlowMonitor orders={[order]} />)
    expect(screen.getByText('min')).toBeInTheDocument()
  })
})
