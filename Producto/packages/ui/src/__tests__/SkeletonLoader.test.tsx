import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton, CardSkeleton, OrderCardSkeleton } from '../components/SkeletonLoader'

describe('Skeleton', () => {
  it('renderiza un div', () => {
    const { container } = render(<Skeleton />)
    expect(container.querySelector('div')).toBeInTheDocument()
  })

  it('incluye clase animate-pulse', () => {
    const { container } = render(<Skeleton />)
    expect(container.querySelector('div')?.className).toContain('animate-pulse')
  })

  it('combina className adicional', () => {
    const { container } = render(<Skeleton className="w-32 h-8" />)
    const className = container.querySelector('div')?.className ?? ''
    expect(className).toContain('w-32')
    expect(className).toContain('h-8')
  })

  it('pasa props HTML adicionales (data-testid)', () => {
    render(<Skeleton data-testid="skeleton-header" />)
    expect(screen.getByTestId('skeleton-header')).toBeInTheDocument()
  })
})

describe('CardSkeleton', () => {
  it('renderiza sin errores', () => {
    const { container } = render(<CardSkeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('contiene múltiples elementos Skeleton', () => {
    const { container } = render(<CardSkeleton />)
    const pulsingElements = container.querySelectorAll('.animate-pulse')
    expect(pulsingElements.length).toBeGreaterThan(1)
  })
})

describe('OrderCardSkeleton', () => {
  it('renderiza sin errores', () => {
    const { container } = render(<OrderCardSkeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('contiene múltiples elementos Skeleton', () => {
    const { container } = render(<OrderCardSkeleton />)
    const pulsingElements = container.querySelectorAll('.animate-pulse')
    expect(pulsingElements.length).toBeGreaterThan(2)
  })
})
