import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PremiumHeader } from '../components/PremiumHeader'
import { Coffee } from 'lucide-react'

describe('PremiumHeader — renderizado', () => {
  it('muestra el título', () => {
    render(<PremiumHeader title="Dashboard" icon={Coffee} />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('muestra accentTitle cuando se proporciona', () => {
    render(<PremiumHeader title="My" accentTitle="App" icon={Coffee} />)
    expect(screen.getByText('App')).toBeInTheDocument()
  })

  it('muestra statusLabel personalizado', () => {
    render(<PremiumHeader title="Test" icon={Coffee} statusLabel="En línea" />)
    expect(screen.getByText('En línea')).toBeInTheDocument()
  })

  it('muestra el statusLabel por defecto "Live System"', () => {
    render(<PremiumHeader title="Test" icon={Coffee} />)
    expect(screen.getByText('Live System')).toBeInTheDocument()
  })

  it('muestra statusSubLabel cuando se proporciona', () => {
    render(<PremiumHeader title="Test" icon={Coffee} statusSubLabel="3 mesas" />)
    expect(screen.getByText('3 mesas')).toBeInTheDocument()
  })

  it('renderiza stats en el slot de estadísticas', () => {
    render(<PremiumHeader title="Test" icon={Coffee} stats={<span data-testid="stat">KPI</span>} />)
    expect(screen.getByTestId('stat')).toBeInTheDocument()
  })

  it('renderiza actions en el slot de acciones', () => {
    render(<PremiumHeader title="Test" icon={Coffee} actions={<button>Nueva Mesa</button>} />)
    expect(screen.getByRole('button', { name: 'Nueva Mesa' })).toBeInTheDocument()
  })

  it('renderiza en variante compact', () => {
    render(<PremiumHeader title="Compact" icon={Coffee} variant="compact" />)
    expect(screen.getByText('Compact')).toBeInTheDocument()
  })
})
