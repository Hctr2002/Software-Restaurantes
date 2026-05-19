import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PortalMenuItemCard } from '../components/portal/PortalMenuItemCard'
import type { PortalMenuItem } from '../components/portal/PortalMenuItemCard'

// getPublicImageUrl is mocked globally in setup.ts

function makeItem(overrides: Partial<PortalMenuItem> = {}): PortalMenuItem {
  return {
    id: 'item-1',
    name: 'Empanada de Pino',
    description: 'Rellena con carne y cebolla.',
    price: 2500,
    categoryId: 'cat-1',
    image_url: '/images/empanada.jpg',
    imageUrl: '/images/empanada.jpg',
    is_active: true,
    isActive: true,
    restaurantId: 'rest-1',
    ...overrides,
  }
}

describe('PortalMenuItemCard — renderizado básico', () => {
  it('muestra el nombre del ítem', () => {
    render(<PortalMenuItemCard item={makeItem()} cartQuantity={0} onAdd={vi.fn()} onDecrement={vi.fn()} />)
    expect(screen.getByText('Empanada de Pino')).toBeInTheDocument()
  })

  it('muestra el precio formateado', () => {
    render(<PortalMenuItemCard item={makeItem({ price: 3500 })} cartQuantity={0} onAdd={vi.fn()} onDecrement={vi.fn()} />)
    // toLocaleString() separator varies by Node ICU locale (. or ,)
    expect(screen.getByText(/\$3[.,]500/)).toBeInTheDocument()
  })

  it('muestra la descripción', () => {
    render(<PortalMenuItemCard item={makeItem()} cartQuantity={0} onAdd={vi.fn()} onDecrement={vi.fn()} />)
    expect(screen.getByText('Rellena con carne y cebolla.')).toBeInTheDocument()
  })

  it('muestra botón Añadir al Carrito cuando cartQuantity=0', () => {
    render(<PortalMenuItemCard item={makeItem()} cartQuantity={0} onAdd={vi.fn()} onDecrement={vi.fn()} />)
    expect(screen.getByText('Añadir al Carrito')).toBeInTheDocument()
  })

  it('renderiza la imagen con alt del nombre del ítem', () => {
    render(<PortalMenuItemCard item={makeItem()} cartQuantity={0} onAdd={vi.fn()} onDecrement={vi.fn()} />)
    expect(screen.getByAltText('Empanada de Pino')).toBeInTheDocument()
  })
})

describe('PortalMenuItemCard — con ítems en carrito', () => {
  it('muestra controles +/− cuando cartQuantity > 0', () => {
    render(<PortalMenuItemCard item={makeItem()} cartQuantity={2} onAdd={vi.fn()} onDecrement={vi.fn()} />)
    expect(screen.getByLabelText('Aumentar cantidad')).toBeInTheDocument()
    expect(screen.getByLabelText('Disminuir cantidad')).toBeInTheDocument()
  })

  it('muestra la cantidad actual en carrito', () => {
    render(<PortalMenuItemCard item={makeItem()} cartQuantity={3} onAdd={vi.fn()} onDecrement={vi.fn()} />)
    // quantity appears in both badge and counter; assert at least one is present
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1)
  })

  it('no muestra botón Añadir al Carrito cuando cartQuantity > 0', () => {
    render(<PortalMenuItemCard item={makeItem()} cartQuantity={1} onAdd={vi.fn()} onDecrement={vi.fn()} />)
    expect(screen.queryByText('Añadir al Carrito')).not.toBeInTheDocument()
  })
})

describe('PortalMenuItemCard — callbacks', () => {
  it('llama onAdd al hacer clic en Añadir al Carrito', () => {
    const onAdd = vi.fn()
    render(<PortalMenuItemCard item={makeItem()} cartQuantity={0} onAdd={onAdd} onDecrement={vi.fn()} />)
    fireEvent.click(screen.getByText('Añadir al Carrito'))
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ id: 'item-1' }))
  })

  it('llama onAdd al hacer clic en + con item en carrito', () => {
    const onAdd = vi.fn()
    render(<PortalMenuItemCard item={makeItem()} cartQuantity={2} onAdd={onAdd} onDecrement={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Aumentar cantidad'))
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ id: 'item-1' }))
  })

  it('llama onDecrement con el id del ítem al hacer clic en −', () => {
    const onDecrement = vi.fn()
    render(<PortalMenuItemCard item={makeItem()} cartQuantity={2} onAdd={vi.fn()} onDecrement={onDecrement} />)
    fireEvent.click(screen.getByLabelText('Disminuir cantidad'))
    expect(onDecrement).toHaveBeenCalledWith('item-1')
  })
})

describe('PortalMenuItemCard — imagen', () => {
  it('usa getPublicImageUrl para construir la URL', async () => {
    const { getPublicImageUrl } = await import('@menu-bites/auth')
    render(<PortalMenuItemCard item={makeItem({ imageUrl: 'food.jpg' })} cartQuantity={0} onAdd={vi.fn()} onDecrement={vi.fn()} />)
    expect(getPublicImageUrl).toHaveBeenCalledWith('food.jpg')
  })

  it('maneja imageUrl null con placeholder', () => {
    render(<PortalMenuItemCard item={makeItem({ imageUrl: null })} cartQuantity={0} onAdd={vi.fn()} onDecrement={vi.fn()} />)
    const img = screen.getByAltText('Empanada de Pino') as HTMLImageElement
    // getPublicImageUrl mock returns the path or '/placeholder-food.jpg' for null
    expect(img.src).toBeTruthy()
  })
})
