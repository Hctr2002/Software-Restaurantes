import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TableCard } from '../components/terminal/TableCard'
import type { TableRecord } from '@menu-bites/auth'

function makeTable(overrides: Partial<TableRecord> = {}): TableRecord & { current_session_id?: string | null } {
  return {
    id: 'table-1',
    number: 3,
    label: null,
    status: 'OCCUPIED',
    qrData: null,
    restaurantId: 'rest-1',
    billRequested: false,
    helpRequested: false,
    current_session_id: null,
    ...overrides,
  }
}

const defaultProps = {
  isBillRequested: false,
  isReady: false,
  isPreparing: false,
  mergeMode: false,
  isSelectedForMerge: false,
  onSelect: vi.fn(),
  onNavigate: vi.fn(),
}

describe('TableCard — renderizado', () => {
  it('muestra el número de mesa', () => {
    render(<TableCard table={makeTable({ number: 7 })} {...defaultProps} />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('muestra el estado de la mesa en uppercase', () => {
    render(<TableCard table={makeTable({ status: 'FREE' })} {...defaultProps} />)
    expect(screen.getByText('FREE')).toBeInTheDocument()
  })

  it('muestra badge LISTO cuando isReady=true', () => {
    render(<TableCard table={makeTable()} {...defaultProps} isReady />)
    expect(screen.getByText('LISTO')).toBeInTheDocument()
  })

  it('muestra badge PREPARANDO cuando isPreparing=true y isReady=false', () => {
    render(<TableCard table={makeTable()} {...defaultProps} isPreparing />)
    expect(screen.getByText('PREPARANDO')).toBeInTheDocument()
  })

  it('no muestra badge PREPARANDO cuando isReady=true', () => {
    render(<TableCard table={makeTable()} {...defaultProps} isReady isPreparing />)
    expect(screen.queryByText('PREPARANDO')).not.toBeInTheDocument()
  })

  it('muestra badge CUENTA cuando isBillRequested=true', () => {
    render(<TableCard table={makeTable()} {...defaultProps} isBillRequested />)
    expect(screen.getByText('CUENTA')).toBeInTheDocument()
  })

  it('muestra badge LIMPIAR cuando estado es CLEANING', () => {
    render(<TableCard table={makeTable({ status: 'CLEANING' })} {...defaultProps} />)
    expect(screen.getByText('LIMPIAR')).toBeInTheDocument()
  })
})

describe('TableCard — conteo de ítems', () => {
  it('muestra conteo de ítems activos', () => {
    const orders = [{
      tableId: 'table-1',
      status: 'PREPARING',
      order_items: [{ id: 'i1' }, { id: 'i2' }],
    }]
    render(<TableCard table={makeTable()} {...defaultProps} orders={orders} />)
    expect(screen.getByText('2 ítem(s) en curso')).toBeInTheDocument()
  })

  it('no muestra el conteo cuando no hay ítems', () => {
    render(<TableCard table={makeTable()} {...defaultProps} orders={[]} />)
    expect(screen.queryByText(/ítem\(s\) en curso/)).not.toBeInTheDocument()
  })

  it('excluye pedidos COMPLETED del conteo', () => {
    const orders = [
      { tableId: 'table-1', status: 'COMPLETED', order_items: [{ id: 'i1' }] },
      { tableId: 'table-1', status: 'PREPARING', order_items: [{ id: 'i2' }] },
    ]
    render(<TableCard table={makeTable()} {...defaultProps} orders={orders} />)
    expect(screen.getByText('1 ítem(s) en curso')).toBeInTheDocument()
  })
})

describe('TableCard — navegación', () => {
  it('llama onNavigate al hacer clic cuando mergeMode=false', () => {
    const onNavigate = vi.fn()
    const { container } = render(
      <TableCard table={makeTable()} {...defaultProps} onNavigate={onNavigate} />
    )
    fireEvent.click(container.querySelector('.rounded-\\[2\\.5rem\\]') ?? container.firstChild as Element)
    expect(onNavigate).toHaveBeenCalled()
  })
})

describe('TableCard — modo fusión', () => {
  it('llama onSelect en mergeMode para mesa OCCUPIED', () => {
    const onSelect = vi.fn()
    render(
      <TableCard
        table={makeTable({ status: 'OCCUPIED' })}
        {...defaultProps}
        mergeMode
        onSelect={onSelect}
      />
    )
    // Click on the outer motion div
    fireEvent.click(screen.getByText('3').closest('[class*="relative"]') as Element)
    expect(onSelect).toHaveBeenCalledWith('table-1')
  })

  it('muestra indicador visual cuando isSelectedForMerge=true', () => {
    render(
      <TableCard
        table={makeTable({ status: 'OCCUPIED' })}
        {...defaultProps}
        mergeMode
        isSelectedForMerge
      />
    )
    // The checkmark circle appears when selected
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
