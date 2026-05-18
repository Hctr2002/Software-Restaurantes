import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AlertModal } from '../components/terminal/AlertModal'

function renderAlertModal(overrides = {}) {
  const defaults = {
    alertType: 'HELP_REQUEST',
    setAlertType: vi.fn(),
    alertMsg: '',
    setAlertMsg: vi.fn(),
    tableNum: '',
    setTableNum: vi.fn(),
    sendingAlert: false,
    alertSent: false,
    onSend: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  }
  return { ...render(<AlertModal {...defaults} />), ...defaults }
}

describe('AlertModal — renderizado', () => {
  it('muestra el título Canal de Emergencia', () => {
    renderAlertModal()
    expect(screen.getByText('Canal de Emergencia')).toBeInTheDocument()
  })

  it('muestra las 4 opciones de tipo de alerta', () => {
    renderAlertModal()
    expect(screen.getByText('Problema en Mesa')).toBeInTheDocument()
    expect(screen.getByText('Pedir Cuenta')).toBeInTheDocument()
    expect(screen.getByText('Necesito Ayuda')).toBeInTheDocument()
    expect(screen.getByText('Mensaje General')).toBeInTheDocument()
  })

  it('muestra el campo de número de mesa', () => {
    renderAlertModal()
    expect(screen.getByLabelText('N° de Mesa Afectada')).toBeInTheDocument()
  })

  it('muestra el campo de descripción', () => {
    renderAlertModal()
    expect(screen.getByLabelText('Descripción del Problema')).toBeInTheDocument()
  })

  it('muestra el botón Cancelar', () => {
    renderAlertModal()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('muestra el botón Emitir Alerta cuando no se está enviando', () => {
    renderAlertModal({ alertMsg: 'Mensaje' })
    expect(screen.getByRole('button', { name: 'Emitir Alerta' })).toBeInTheDocument()
  })
})

describe('AlertModal — estados del botón enviar', () => {
  it('botón deshabilitado cuando alertMsg está vacío', () => {
    renderAlertModal({ alertMsg: '' })
    const button = screen.getByRole('button', { name: 'Emitir Alerta' })
    expect(button).toBeDisabled()
  })

  it('botón habilitado cuando hay mensaje', () => {
    renderAlertModal({ alertMsg: 'Hay un problema' })
    const button = screen.getByRole('button', { name: 'Emitir Alerta' })
    expect(button).not.toBeDisabled()
  })

  it('muestra "Enviado" cuando alertSent=true', () => {
    renderAlertModal({ alertSent: true, alertMsg: 'mensaje' })
    expect(screen.getByRole('button', { name: 'Enviado' })).toBeInTheDocument()
  })

  it('botón deshabilitado cuando alertSent=true', () => {
    renderAlertModal({ alertSent: true, alertMsg: 'mensaje' })
    expect(screen.getByRole('button', { name: 'Enviado' })).toBeDisabled()
  })
})

describe('AlertModal — callbacks', () => {
  it('llama onClose al hacer clic en Cancelar', () => {
    const { onClose } = renderAlertModal()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('llama onClose al hacer clic en el botón X', () => {
    const { onClose } = renderAlertModal()
    const xButton = screen.getAllByRole('button').find(b => b.className?.includes('rounded-2xl') || b.className?.includes('p-3'))
    if (xButton) fireEvent.click(xButton)
    expect(onClose).toHaveBeenCalled()
  })

  it('llama onSend al hacer clic en Emitir Alerta', () => {
    const { onSend } = renderAlertModal({ alertMsg: 'problema' })
    fireEvent.click(screen.getByRole('button', { name: 'Emitir Alerta' }))
    expect(onSend).toHaveBeenCalledTimes(1)
  })

  it('llama setAlertMsg al escribir en el campo de descripción', () => {
    const { setAlertMsg } = renderAlertModal()
    fireEvent.change(screen.getByLabelText('Descripción del Problema'), {
      target: { value: 'Nuevo mensaje' },
    })
    expect(setAlertMsg).toHaveBeenCalledWith('Nuevo mensaje')
  })

  it('llama setTableNum al escribir en el campo de mesa', () => {
    const { setTableNum } = renderAlertModal()
    fireEvent.change(screen.getByLabelText('N° de Mesa Afectada'), {
      target: { value: '5' },
    })
    expect(setTableNum).toHaveBeenCalledWith('5')
  })

  it('llama setAlertType al seleccionar una opción', () => {
    const { setAlertType } = renderAlertModal()
    fireEvent.click(screen.getByText('Pedir Cuenta'))
    expect(setAlertType).toHaveBeenCalledWith('BILL_REQUEST')
  })
})
