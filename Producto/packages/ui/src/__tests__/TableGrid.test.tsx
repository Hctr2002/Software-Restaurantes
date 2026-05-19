import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TableGridItem, TableGrid } from '../components/TableGrid'

describe('TableGridItem — renderizado', () => {
  it('muestra el número de mesa', () => {
    render(<TableGridItem number={5} status="FREE" />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('muestra Libre cuando status=FREE', () => {
    render(<TableGridItem number={1} status="FREE" />)
    expect(screen.getByText('Libre')).toBeInTheDocument()
  })

  it('muestra Ocupada cuando status=OCCUPIED', () => {
    render(<TableGridItem number={2} status="OCCUPIED" />)
    expect(screen.getByText('Ocupada')).toBeInTheDocument()
  })

  it('muestra Reservada cuando status=RESERVED', () => {
    render(<TableGridItem number={3} status="RESERVED" />)
    expect(screen.getByText('Reservada')).toBeInTheDocument()
  })

  it('muestra el label cuando se proporciona', () => {
    render(<TableGridItem number={4} status="FREE" label="VIP" />)
    expect(screen.getByText('VIP')).toBeInTheDocument()
  })

  it('no muestra label cuando no se proporciona', () => {
    const { container } = render(<TableGridItem number={4} status="FREE" />)
    // No span with text content from label
    const labels = Array.from(container.querySelectorAll('span')).filter(s => s.textContent === 'VIP')
    expect(labels.length).toBe(0)
  })
})

describe('TableGridItem — callbacks', () => {
  it('llama onClick cuando status=FREE', () => {
    const onClick = vi.fn()
    render(<TableGridItem number={1} status="FREE" onClick={onClick} />)
    fireEvent.click(screen.getByText('1'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('no llama onClick cuando status=OCCUPIED', () => {
    const onClick = vi.fn()
    render(<TableGridItem number={1} status="OCCUPIED" onClick={onClick} />)
    fireEvent.click(screen.getByText('1'))
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('TableGrid — renderizado', () => {
  it('renderiza children', () => {
    render(
      <TableGrid>
        <div data-testid="child-1">Hijo 1</div>
        <div data-testid="child-2">Hijo 2</div>
      </TableGrid>
    )
    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
  })
})
