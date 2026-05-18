import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CategoryTabs } from '../components/CategoryTabs'

const cats = [
  { id: 'cat-1', name: 'Entradas' },
  { id: 'cat-2', name: 'Platos Principales' },
  { id: 'cat-3', name: 'Postres' },
]

describe('CategoryTabs — renderizado', () => {
  it('muestra todas las categorías', () => {
    render(<CategoryTabs categories={cats} onSelect={vi.fn()} />)
    expect(screen.getByText('Entradas')).toBeInTheDocument()
    expect(screen.getByText('Platos Principales')).toBeInTheDocument()
    expect(screen.getByText('Postres')).toBeInTheDocument()
  })

  it('no renderiza nada con categorías vacías', () => {
    const { container } = render(<CategoryTabs categories={[]} onSelect={vi.fn()} />)
    expect(container.querySelectorAll('button').length).toBe(0)
  })

  it('aplica clase activa al tab seleccionado', () => {
    render(<CategoryTabs categories={cats} activeId="cat-2" onSelect={vi.fn()} />)
    const btn = screen.getByText('Platos Principales')
    expect(btn.className).toContain('bg-primary')
  })

  it('tab no activo no tiene bg-primary', () => {
    render(<CategoryTabs categories={cats} activeId="cat-1" onSelect={vi.fn()} />)
    const btn = screen.getByText('Postres')
    expect(btn.className).not.toContain('bg-primary')
  })
})

describe('CategoryTabs — callbacks', () => {
  it('llama onSelect con el id de la categoría al hacer clic', () => {
    const onSelect = vi.fn()
    render(<CategoryTabs categories={cats} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Entradas'))
    expect(onSelect).toHaveBeenCalledWith('cat-1')
  })

  it('llama onSelect con el id correcto para cada tab', () => {
    const onSelect = vi.fn()
    render(<CategoryTabs categories={cats} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Postres'))
    expect(onSelect).toHaveBeenCalledWith('cat-3')
  })
})
