import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '../components/ui/input'

describe('Input — renderizado', () => {
  it('renderiza un elemento input', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('aplica el placeholder', () => {
    render(<Input placeholder="Escribe aquí..." />)
    expect(screen.getByPlaceholderText('Escribe aquí...')).toBeInTheDocument()
  })

  it('aplica type correctamente', () => {
    const { container } = render(<Input type="email" />)
    expect(container.querySelector('input')?.type).toBe('email')
  })

  it('aplica className adicional', () => {
    const { container } = render(<Input className="mt-4" />)
    expect(container.querySelector('input')?.className).toContain('mt-4')
  })

  it('incluye clases base de estilo', () => {
    const { container } = render(<Input />)
    const className = container.querySelector('input')?.className ?? ''
    expect(className).toContain('rounded-xl')
    expect(className).toContain('border')
  })
})

describe('Input — comportamiento', () => {
  it('llama onChange al escribir', () => {
    const onChange = vi.fn()
    render(<Input onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hola' } })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('disabled desactiva el input', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('disabled aplica opacity-50', () => {
    const { container } = render(<Input disabled />)
    expect(container.querySelector('input')?.className).toContain('disabled:opacity-50')
  })

  it('acepta value controlado', () => {
    render(<Input value="valor inicial" onChange={vi.fn()} />)
    expect(screen.getByDisplayValue('valor inicial')).toBeInTheDocument()
  })
})

describe('Input — tipos especiales', () => {
  it('type=number acepta valores numéricos', () => {
    const onChange = vi.fn()
    const { container } = render(<Input type="number" onChange={onChange} />)
    const input = container.querySelector('input')!
    fireEvent.change(input, { target: { value: '42' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('type=password oculta el texto', () => {
    const { container } = render(<Input type="password" />)
    expect(container.querySelector('input')?.type).toBe('password')
  })
})
