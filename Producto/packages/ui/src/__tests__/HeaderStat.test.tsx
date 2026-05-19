import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeaderStat } from '../components/HeaderStat'

describe('HeaderStat — renderizado', () => {
  it('muestra la etiqueta', () => {
    render(<HeaderStat label="Pedidos Activos" value={12} />)
    expect(screen.getByText('Pedidos Activos')).toBeInTheDocument()
  })

  it('muestra el valor numérico', () => {
    render(<HeaderStat label="Ventas" value={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('muestra valor string', () => {
    render(<HeaderStat label="Estado" value="En línea" />)
    expect(screen.getByText('En línea')).toBeInTheDocument()
  })

  it('muestra valor 0', () => {
    render(<HeaderStat label="Rechazados" value={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('aplica color personalizado al valor', () => {
    const { container } = render(<HeaderStat label="Ingresos" value="$50.000" color="text-emerald-500" />)
    expect(container.querySelector('.text-emerald-500')).toBeInTheDocument()
  })

  it('sin color usa text-foreground por defecto', () => {
    const { container } = render(<HeaderStat label="Test" value={1} />)
    expect(container.querySelector('.text-foreground')).toBeInTheDocument()
  })

  it('aplica className adicional al contenedor', () => {
    const { container } = render(<HeaderStat label="Test" value={5} className="px-8" />)
    expect(container.querySelector('.px-8')).toBeInTheDocument()
  })
})

describe('HeaderStat — múltiples instancias', () => {
  it('renderiza múltiples stats independientes', () => {
    render(
      <>
        <HeaderStat label="Pendientes" value={3} />
        <HeaderStat label="Listos" value={7} />
        <HeaderStat label="Entregados" value={15} />
      </>
    )
    expect(screen.getByText('Pendientes')).toBeInTheDocument()
    expect(screen.getByText('Listos')).toBeInTheDocument()
    expect(screen.getByText('Entregados')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })
})
