import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../components/ui/button'

describe('Button — renderizado', () => {
  it('renderiza el texto children', () => {
    render(<Button>Confirmar</Button>)
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
  })

  it('renderiza como elemento <button> por defecto', () => {
    render(<Button>Test</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('aplica className adicional', () => {
    const { container } = render(<Button className="mt-4">Test</Button>)
    expect(container.querySelector('button')?.className).toContain('mt-4')
  })
})

describe('Button — variantes', () => {
  it('variante default incluye bg-primary', () => {
    const { container } = render(<Button variant="default">Default</Button>)
    expect(container.querySelector('button')?.className).toContain('bg-primary')
  })

  it('variante destructive incluye bg-destructive', () => {
    const { container } = render(<Button variant="destructive">Eliminar</Button>)
    expect(container.querySelector('button')?.className).toContain('bg-destructive')
  })

  it('variante outline incluye border', () => {
    const { container } = render(<Button variant="outline">Cancelar</Button>)
    expect(container.querySelector('button')?.className).toContain('border')
  })

  it('variante ghost no tiene fondo sólido', () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>)
    const className = container.querySelector('button')?.className ?? ''
    expect(className).not.toContain('bg-primary')
  })

  it('variante link incluye text-primary', () => {
    const { container } = render(<Button variant="link">Link</Button>)
    expect(container.querySelector('button')?.className).toContain('text-primary')
  })
})

describe('Button — tamaños', () => {
  it('size sm aplica h-9', () => {
    const { container } = render(<Button size="sm">Pequeño</Button>)
    expect(container.querySelector('button')?.className).toContain('h-9')
  })

  it('size lg aplica h-14', () => {
    const { container } = render(<Button size="lg">Grande</Button>)
    expect(container.querySelector('button')?.className).toContain('h-14')
  })

  it('size icon aplica h-10 w-10', () => {
    const { container } = render(<Button size="icon">X</Button>)
    const className = container.querySelector('button')?.className ?? ''
    expect(className).toContain('h-10')
    expect(className).toContain('w-10')
  })
})

describe('Button — interacciones', () => {
  it('llama onClick al hacer clic', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Clic</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('disabled bloquea el clic', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Deshabilitado</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('disabled aplica pointer-events-none', () => {
    const { container } = render(<Button disabled>Deshabilitado</Button>)
    expect(container.querySelector('button')?.className).toContain('disabled:pointer-events-none')
  })
})

describe('Button — asChild', () => {
  it('asChild renderiza el elemento hijo en lugar de button', () => {
    render(
      <Button asChild>
        <a href="/ruta">Ir a ruta</a>
      </Button>
    )
    expect(screen.getByRole('link', { name: 'Ir a ruta' })).toBeInTheDocument()
  })
})
