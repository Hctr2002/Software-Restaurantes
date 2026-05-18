import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '../components/Badge'

describe('Badge — renderizado', () => {
  it('renderiza el texto children', () => {
    render(<Badge>Listo</Badge>)
    expect(screen.getByText('Listo')).toBeInTheDocument()
  })

  it('usa variante "neutral" por defecto', () => {
    const { container } = render(<Badge>Test</Badge>)
    const span = container.querySelector('span')
    expect(span?.className).toContain('bg-muted')
  })

  it('aplica variante "success"', () => {
    const { container } = render(<Badge variant="success">Entregado</Badge>)
    const span = container.querySelector('span')
    expect(span?.className).toContain('bg-emerald-500/10')
    expect(span?.className).toContain('text-emerald-500')
  })

  it('aplica variante "danger"', () => {
    const { container } = render(<Badge variant="danger">Rechazado</Badge>)
    const span = container.querySelector('span')
    expect(span?.className).toContain('bg-red-500/10')
    expect(span?.className).toContain('text-red-500')
  })

  it('aplica variante "warning"', () => {
    const { container } = render(<Badge variant="warning">Pendiente</Badge>)
    const span = container.querySelector('span')
    expect(span?.className).toContain('bg-amber-500/10')
    expect(span?.className).toContain('text-amber-500')
  })

  it('aplica variante "info"', () => {
    const { container } = render(<Badge variant="info">Info</Badge>)
    const span = container.querySelector('span')
    expect(span?.className).toContain('bg-primary/10')
    expect(span?.className).toContain('text-primary')
  })

  it('combina className adicional con las clases base', () => {
    const { container } = render(<Badge className="ml-2">Test</Badge>)
    const span = container.querySelector('span')
    expect(span?.className).toContain('ml-2')
  })

  it('renderiza como elemento <span>', () => {
    const { container } = render(<Badge>Test</Badge>)
    expect(container.querySelector('span')).toBeInTheDocument()
  })

  it('incluye clases base de layout', () => {
    const { container } = render(<Badge>Test</Badge>)
    const span = container.querySelector('span')
    expect(span?.className).toContain('rounded')
    expect(span?.className).toContain('font-bold')
    expect(span?.className).toContain('uppercase')
  })
})

describe('Badge — mapeo de estados de pedido', () => {
  const statusToVariant: Array<{ label: string; variant: 'success' | 'danger' | 'warning' | 'neutral' | 'info' }> = [
    { label: 'Listo', variant: 'success' },
    { label: 'Rechazado', variant: 'danger' },
    { label: 'En preparación', variant: 'warning' },
    { label: 'Confirmado', variant: 'info' },
    { label: 'Solicitado', variant: 'neutral' },
  ]

  statusToVariant.forEach(({ label, variant }) => {
    it(`renderiza badge para estado "${label}"`, () => {
      render(<Badge variant={variant}>{label}</Badge>)
      expect(screen.getByText(label)).toBeInTheDocument()
    })
  })
})
