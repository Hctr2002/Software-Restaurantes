// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'

// AccountActions solo importa el TIPO TableRecord de @menu-bites/auth.
vi.mock('@menu-bites/auth', () => ({}))

// framer-motion: renderizar HTML plano sin animaciones.
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: () => ({ children, ...rest }: any) => {
      const { initial, animate, exit, layout, transition, whileHover, whileTap, ...dom } = rest
      return <div {...dom}>{children}</div>
    },
  }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Sustituimos el design system por primitivos simples para aislar la lógica del botón.
vi.mock('@menu-bites/ui', () => ({
  cn: (...a: any[]) => a.filter(Boolean).join(' '),
  PortalText: ({ children }: any) => <span>{children}</span>,
  PortalPrimaryButton: ({ children, onClick, disabled, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>{children}</button>
  ),
}))

vi.mock('lucide-react', () => ({
  ClipboardList: () => <span data-testid="icon-clipboard" />,
  Receipt: () => <span data-testid="icon-receipt" />,
  Loader2: () => <span data-testid="icon-loader" />,
  ChevronRight: () => <span data-testid="icon-chevron" />,
  Bell: () => <span data-testid="icon-bell" />,
}))

import { AccountActions } from '../app/[restaurantSlug]/[tableNumber]/_components/AccountActions'

const baseProps = {
  tableData: { id: 't1', number: 1 } as any,
  tableOrdersCount: 0,
  cartCount: 0,
  cartTotal: 0,
  billRequested: false,
  isRequestingBill: false,
  waiterCalled: false,
  isCallingWaiter: false,
  isCheckoutOpen: false,
  onOpenCuenta: vi.fn(),
  onOpenCheckout: vi.fn(),
  onConfirmBill: vi.fn(),
  onCallWaiter: vi.fn(),
}

const garzonBtn = () => screen.getByText(/Garzón|Llamado/).closest('button') as HTMLButtonElement

/**
 * Regresión del bug "el botón de llamar al garzón no cambia, genera duda si se apretó":
 * el botón debe reflejar carga, éxito y bloqueo según el estado.
 */
describe('AccountActions — botón "Garzón"', () => {
  it('estado inicial: habilitado y con texto "Garzón"', () => {
    render(<AccountActions {...baseProps} />)
    expect(garzonBtn()).toBeEnabled()
    expect(garzonBtn()).toHaveTextContent('Garzón')
  })

  it('al hacer click dispara onCallWaiter', () => {
    const onCallWaiter = vi.fn()
    render(<AccountActions {...baseProps} onCallWaiter={onCallWaiter} />)
    fireEvent.click(garzonBtn())
    expect(onCallWaiter).toHaveBeenCalledTimes(1)
  })

  it('mientras llama: deshabilitado y muestra spinner', () => {
    render(<AccountActions {...baseProps} isCallingWaiter />)
    expect(garzonBtn()).toBeDisabled()
    expect(screen.getByTestId('icon-loader')).toBeInTheDocument()
  })

  it('tras confirmar: "✓ Llamado", deshabilitado y variante success', () => {
    render(<AccountActions {...baseProps} waiterCalled />)
    const btn = garzonBtn()
    expect(btn).toHaveTextContent('✓ Llamado')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('data-variant', 'success')
  })
})
