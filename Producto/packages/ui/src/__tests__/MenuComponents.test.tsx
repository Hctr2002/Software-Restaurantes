import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MenuItemCard, ProductSearchBar } from '../components/MenuComponents'

describe('MenuItemCard — renderizado', () => {
  it('muestra el nombre del ítem', () => {
    render(<MenuItemCard name="Pizza Margherita" price={8000} />)
    expect(screen.getByText('Pizza Margherita')).toBeInTheDocument()
  })

  it('muestra el precio formateado', () => {
    render(<MenuItemCard name="Tacos" price={3500} />)
    expect(screen.getByText(/3[.,]500/)).toBeInTheDocument()
  })

  it('muestra la descripción cuando se proporciona', () => {
    render(<MenuItemCard name="Tacos" price={3500} description="Con salsa roja" />)
    expect(screen.getByText('Con salsa roja')).toBeInTheDocument()
  })

  it('no muestra descripción cuando no se proporciona', () => {
    render(<MenuItemCard name="Tacos" price={3500} />)
    expect(screen.queryByText('Con salsa roja')).not.toBeInTheDocument()
  })

  it('muestra imagen cuando se proporciona imageUrl', () => {
    render(<MenuItemCard name="Tacos" price={3500} imageUrl="/food.jpg" />)
    expect(screen.getByAltText('Tacos')).toBeInTheDocument()
  })

  it('muestra botón Añadir', () => {
    render(<MenuItemCard name="Tacos" price={3500} />)
    expect(screen.getByText('Añadir')).toBeInTheDocument()
  })
})

describe('MenuItemCard — callbacks', () => {
  it('llama onAdd al hacer clic en Añadir', () => {
    const onAdd = vi.fn()
    render(<MenuItemCard name="Tacos" price={3500} onAdd={onAdd} />)
    fireEvent.click(screen.getByText('Añadir'))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })
})

describe('ProductSearchBar — renderizado', () => {
  it('muestra el placeholder', () => {
    render(<ProductSearchBar value="" onChange={vi.fn()} onClear={vi.fn()} />)
    expect(screen.getByPlaceholderText('Buscar plato, bebida...')).toBeInTheDocument()
  })

  it('muestra el valor actual', () => {
    render(<ProductSearchBar value="pizza" onChange={vi.fn()} onClear={vi.fn()} />)
    expect(screen.getByDisplayValue('pizza')).toBeInTheDocument()
  })

  it('no muestra botón X cuando value está vacío', () => {
    render(<ProductSearchBar value="" onChange={vi.fn()} onClear={vi.fn()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('muestra botón X cuando value tiene contenido', () => {
    render(<ProductSearchBar value="algo" onChange={vi.fn()} onClear={vi.fn()} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})

describe('ProductSearchBar — callbacks', () => {
  it('llama onChange al escribir', () => {
    const onChange = vi.fn()
    render(<ProductSearchBar value="" onChange={onChange} onClear={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Buscar plato, bebida...'), { target: { value: 'sopa' } })
    expect(onChange).toHaveBeenCalledWith('sopa')
  })

  it('llama onClear al hacer clic en X', () => {
    const onClear = vi.fn()
    render(<ProductSearchBar value="algo" onChange={vi.fn()} onClear={onClear} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
