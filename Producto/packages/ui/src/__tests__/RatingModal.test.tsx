import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RatingModal } from '../components/portal/RatingModal'

const defaultProps = {
  restaurantName: 'Mi Restaurante',
  stars: 0,
  comment: '',
  submitting: false,
  done: false,
  onStarsChange: vi.fn(),
  onCommentChange: vi.fn(),
  onSubmit: vi.fn(),
  onSkip: vi.fn(),
}

describe('RatingModal — renderizado', () => {
  it('muestra la pregunta de experiencia', () => {
    render(<RatingModal {...defaultProps} />)
    expect(screen.getByText('¿Cómo fue tu experiencia?')).toBeInTheDocument()
  })

  it('muestra el nombre del restaurante', () => {
    render(<RatingModal {...defaultProps} />)
    expect(screen.getByText(/Mi Restaurante/)).toBeInTheDocument()
  })

  it('muestra las 5 estrellas', () => {
    render(<RatingModal {...defaultProps} />)
    const stars = screen.getAllByRole('button').filter(b => b.textContent === '★')
    expect(stars.length).toBe(5)
  })

  it('muestra botones Omitir y Enviar', () => {
    render(<RatingModal {...defaultProps} stars={3} />)
    expect(screen.getByText('Omitir')).toBeInTheDocument()
    expect(screen.getByText('Enviar')).toBeInTheDocument()
  })

  it('deshabilita Enviar cuando stars=0', () => {
    render(<RatingModal {...defaultProps} stars={0} />)
    const enviar = screen.getAllByRole('button').find(b => b.textContent === 'Enviar')
    expect(enviar).toBeDisabled()
  })

  it('habilita Enviar cuando stars>0', () => {
    render(<RatingModal {...defaultProps} stars={4} />)
    const enviar = screen.getAllByRole('button').find(b => b.textContent === 'Enviar')
    expect(enviar).not.toBeDisabled()
  })

  it('muestra textarea cuando stars>0', () => {
    render(<RatingModal {...defaultProps} stars={3} />)
    expect(screen.getByPlaceholderText(/Cuéntanos más/)).toBeInTheDocument()
  })

  it('no muestra textarea cuando stars=0', () => {
    render(<RatingModal {...defaultProps} stars={0} />)
    expect(screen.queryByPlaceholderText(/Cuéntanos más/)).not.toBeInTheDocument()
  })
})

describe('RatingModal — estado done', () => {
  it('muestra mensaje de agradecimiento cuando done=true', () => {
    render(<RatingModal {...defaultProps} done />)
    expect(screen.getByText('¡Gracias por tu opinión!')).toBeInTheDocument()
  })

  it('no muestra estrellas cuando done=true', () => {
    render(<RatingModal {...defaultProps} done />)
    expect(screen.queryByText('¿Cómo fue tu experiencia?')).not.toBeInTheDocument()
  })
})

describe('RatingModal — callbacks', () => {
  it('llama onStarsChange con el número de estrella al hacer clic', () => {
    const onStarsChange = vi.fn()
    render(<RatingModal {...defaultProps} onStarsChange={onStarsChange} />)
    const stars = screen.getAllByRole('button').filter(b => b.textContent === '★')
    fireEvent.click(stars[2]) // 3rd star = rating 3
    expect(onStarsChange).toHaveBeenCalledWith(3)
  })

  it('llama onSkip al hacer clic en Omitir', () => {
    const onSkip = vi.fn()
    render(<RatingModal {...defaultProps} stars={3} onSkip={onSkip} />)
    fireEvent.click(screen.getByText('Omitir'))
    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('llama onSubmit al hacer clic en Enviar', () => {
    const onSubmit = vi.fn()
    render(<RatingModal {...defaultProps} stars={4} onSubmit={onSubmit} />)
    fireEvent.click(screen.getByText('Enviar'))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('llama onCommentChange al escribir comentario', () => {
    const onCommentChange = vi.fn()
    render(<RatingModal {...defaultProps} stars={3} onCommentChange={onCommentChange} />)
    fireEvent.change(screen.getByPlaceholderText(/Cuéntanos más/), { target: { value: 'Excelente' } })
    expect(onCommentChange).toHaveBeenCalledWith('Excelente')
  })
})
