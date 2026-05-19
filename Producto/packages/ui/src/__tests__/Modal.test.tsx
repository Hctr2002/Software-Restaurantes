import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Modal from '../components/Modal'

describe('Modal — estado abierto', () => {
  it('muestra el título cuando isOpen=true', async () => {
    render(<Modal isOpen title="Detalles del Pedido" onClose={vi.fn()}>contenido</Modal>)
    await waitFor(() => expect(screen.getByText('Detalles del Pedido')).toBeInTheDocument())
  })

  it('muestra los children cuando isOpen=true', async () => {
    render(<Modal isOpen title="Test" onClose={vi.fn()}><p>Contenido del modal</p></Modal>)
    await waitFor(() => expect(screen.getByText('Contenido del modal')).toBeInTheDocument())
  })

  it('muestra el footer cuando se provee', async () => {
    render(
      <Modal isOpen title="Test" onClose={vi.fn()} footer={<button>Confirmar</button>}>
        contenido
      </Modal>
    )
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument())
  })

  it('muestra el botón de cierre (X)', async () => {
    render(<Modal isOpen title="Test" onClose={vi.fn()}>x</Modal>)
    await waitFor(() => {
      // The X button renders a lucide X icon — check for the close button
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })
})

describe('Modal — estado cerrado', () => {
  it('aplica translate-x-full al panel cuando isOpen=false', async () => {
    const { container } = render(<Modal isOpen={false} title="Test" onClose={vi.fn()}>x</Modal>)
    await waitFor(() => {
      const panel = container.querySelector('.translate-x-full')
      expect(panel).toBeInTheDocument()
    })
  })

  it('aplica opacity-0 al overlay cuando isOpen=false', async () => {
    const { container } = render(<Modal isOpen={false} title="Test" onClose={vi.fn()}>x</Modal>)
    await waitFor(() => {
      const overlay = container.querySelector('.opacity-0')
      expect(overlay).toBeInTheDocument()
    })
  })
})

describe('Modal — callbacks', () => {
  it('llama onClose al hacer clic en el overlay', async () => {
    const onClose = vi.fn()
    const { container } = render(<Modal isOpen title="Test" onClose={onClose}>x</Modal>)
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument())
    const overlay = container.querySelector('.fixed.inset-0.bg-black\\/80') as HTMLElement
    if (overlay) fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('llama onClose al hacer clic en el botón X', async () => {
    const onClose = vi.fn()
    render(<Modal isOpen title="Pedido" onClose={onClose}>x</Modal>)
    await waitFor(() => expect(screen.getByText('Pedido')).toBeInTheDocument())
    // The ghost button with the X icon
    const buttons = screen.getAllByRole('button')
    const closeBtn = buttons.find(b => b.className?.includes('ghost') || b.getAttribute('class')?.includes('rounded-2xl'))
    if (closeBtn) fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })
})

describe('Modal — efectos secundarios', () => {
  it('bloquea el scroll del body cuando isOpen=true', async () => {
    render(<Modal isOpen title="Test" onClose={vi.fn()}>x</Modal>)
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden')
    })
  })

  it('restaura el scroll al desmontar', async () => {
    const { unmount } = render(<Modal isOpen title="Test" onClose={vi.fn()}>x</Modal>)
    await waitFor(() => expect(document.body.style.overflow).toBe('hidden'))
    unmount()
    expect(document.body.style.overflow).toBe('unset')
  })
})
