import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BillAlertIsland } from '../components/dashboard/BillAlertIsland'
import type { TableGroup } from '../components/dashboard/dashboardTypes'

function makeGroup(overrides: Partial<TableGroup> = {}): TableGroup {
  return {
    key: 'group-1',
    tableId: 'table-1',
    sessionId: null,
    tableNumber: 5,
    orders: [],
    total: 10000,
    billRequested: true,
    tipIncluded: false,
    oldestCreatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('BillAlertIsland — renderizado', () => {
  it('no renderiza nada cuando no hay grupos con cuenta solicitada', () => {
    const { container } = render(
      <BillAlertIsland groups={[makeGroup({ billRequested: false })]} onSelect={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('no renderiza nada cuando la lista está vacía', () => {
    const { container } = render(<BillAlertIsland groups={[]} onSelect={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('muestra alerta cuando billRequested=true', () => {
    render(<BillAlertIsland groups={[makeGroup()]} onSelect={vi.fn()} />)
    expect(screen.getByText('Cuenta Solicitada')).toBeInTheDocument()
  })

  it('muestra el número de mesa', () => {
    render(<BillAlertIsland groups={[makeGroup({ tableNumber: 7 })]} onSelect={vi.fn()} />)
    expect(screen.getByText('Mesa 7')).toBeInTheDocument()
  })

  it('muestra S/N cuando tableNumber es null', () => {
    render(<BillAlertIsland groups={[makeGroup({ tableNumber: null })]} onSelect={vi.fn()} />)
    expect(screen.getByText('Mesa S/N')).toBeInTheDocument()
  })

  it('muestra múltiples alertas', () => {
    const groups = [
      makeGroup({ key: 'g1', tableNumber: 1 }),
      makeGroup({ key: 'g2', tableNumber: 2 }),
    ]
    render(<BillAlertIsland groups={groups} onSelect={vi.fn()} />)
    expect(screen.getByText('Mesa 1')).toBeInTheDocument()
    expect(screen.getByText('Mesa 2')).toBeInTheDocument()
  })
})

describe('BillAlertIsland — callbacks', () => {
  it('llama onSelect al hacer clic en la alerta', () => {
    const onSelect = vi.fn()
    const group = makeGroup()
    render(<BillAlertIsland groups={[group]} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Mesa 5'))
    expect(onSelect).toHaveBeenCalledWith(group)
  })

  it('descarta la alerta después de hacer clic', async () => {
    const group = makeGroup()
    render(<BillAlertIsland groups={[group]} onSelect={vi.fn()} />)
    fireEvent.click(screen.getByText('Mesa 5'))
    // After dismiss, the alert should be removed from DOM
    expect(screen.queryByText('Mesa 5')).not.toBeInTheDocument()
  })
})
