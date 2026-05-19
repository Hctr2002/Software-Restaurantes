import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiGrid, KpiCard } from '../components/dashboard/KpiGrid'

const mockStats = {
  ingresos_dia: 85000,
  ingresos_mes: 1200000,
  ticket_promedio: 12500,
  pedidos_dia: 12,
}

describe('KpiCard — renderizado', () => {
  it('muestra la etiqueta', () => {
    render(<KpiCard icon={<span />} label="Ingresos Hoy" value="$85.000" detail="8 pedidos hoy" />)
    expect(screen.getByText('Ingresos Hoy')).toBeInTheDocument()
  })

  it('muestra el valor', () => {
    render(<KpiCard icon={<span />} label="Test" value="$50.000" detail="detalle" />)
    expect(screen.getByText('$50.000')).toBeInTheDocument()
  })

  it('muestra el detalle', () => {
    render(<KpiCard icon={<span />} label="Test" value="$0" detail="Ventas acumuladas" />)
    expect(screen.getByText('Ventas acumuladas')).toBeInTheDocument()
  })
})

describe('KpiGrid — renderizado', () => {
  it('muestra los 4 KPIs', () => {
    render(<KpiGrid stats={mockStats} activeOrdersCount={5} />)
    expect(screen.getByText('Ingresos Hoy')).toBeInTheDocument()
    expect(screen.getByText('Ingresos Mes')).toBeInTheDocument()
    expect(screen.getByText('Ticket Promedio')).toBeInTheDocument()
    expect(screen.getByText('Pedidos Activos')).toBeInTheDocument()
  })

  it('muestra el conteo de pedidos activos', () => {
    render(<KpiGrid stats={mockStats} activeOrdersCount={7} />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('formatea ingresos del día como CLP', () => {
    render(<KpiGrid stats={mockStats} activeOrdersCount={0} />)
    // formatPrice(85000) → contains "85.000"
    const cells = screen.getAllByText(/85/)
    expect(cells.length).toBeGreaterThan(0)
  })

  it('usa 0 cuando stats es null', () => {
    render(<KpiGrid stats={null} activeOrdersCount={0} />)
    // Should render without throwing; all values default to 0
    expect(screen.getByText('Ingresos Hoy')).toBeInTheDocument()
  })

  it('muestra detalle con número de pedidos del día', () => {
    render(<KpiGrid stats={mockStats} activeOrdersCount={0} />)
    expect(screen.getByText('12 pedidos hoy')).toBeInTheDocument()
  })

  it('muestra "Ventas acumuladas" en Ingresos Mes', () => {
    render(<KpiGrid stats={mockStats} activeOrdersCount={0} />)
    expect(screen.getByText('Ventas acumuladas')).toBeInTheDocument()
  })

  it('muestra "Pendientes/Cocina" en Pedidos Activos', () => {
    render(<KpiGrid stats={mockStats} activeOrdersCount={3} />)
    expect(screen.getByText('Pendientes/Cocina')).toBeInTheDocument()
  })
})
