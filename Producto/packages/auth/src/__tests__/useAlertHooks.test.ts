import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const { insertMock } = vi.hoisted(() => ({
  insertMock: vi.fn().mockResolvedValue({ error: null }),
}))

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: insertMock,
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn((cb) => { cb?.('SUBSCRIBED'); return {} }) })),
    removeChannel: vi.fn(),
    realtime: { setAuth: vi.fn() },
    storage: { from: vi.fn(() => ({ getPublicUrl: vi.fn() })) },
  })),
}))

import { useAlertForm, useRealtimeAlerts } from '../hooks/useAlertHooks'

describe('useAlertForm — estado inicial', () => {
  it('inicializa con valores por defecto', () => {
    const { result } = renderHook(() => useAlertForm('rest-1'))
    expect(result.current.alertType).toBe('HELP_REQUEST')
    expect(result.current.alertMsg).toBe('')
    expect(result.current.tableNum).toBe('')
    expect(result.current.sendingAlert).toBe(false)
    expect(result.current.alertSent).toBe(false)
  })
})

describe('useAlertForm — setters de estado', () => {
  it('setAlertType actualiza el tipo de alerta', () => {
    const { result } = renderHook(() => useAlertForm('rest-1'))
    act(() => { result.current.setAlertType('BILL_REQUEST') })
    expect(result.current.alertType).toBe('BILL_REQUEST')
  })

  it('setAlertMsg actualiza el mensaje', () => {
    const { result } = renderHook(() => useAlertForm('rest-1'))
    act(() => { result.current.setAlertMsg('Mesa 3 necesita ayuda') })
    expect(result.current.alertMsg).toBe('Mesa 3 necesita ayuda')
  })

  it('setTableNum actualiza el número de mesa', () => {
    const { result } = renderHook(() => useAlertForm('rest-1'))
    act(() => { result.current.setTableNum('5') })
    expect(result.current.tableNum).toBe('5')
  })

  it('acepta todos los tipos de AlertType', () => {
    const { result } = renderHook(() => useAlertForm('rest-1'))
    const types = ['HELP_REQUEST', 'BILL_REQUEST', 'STOCK_SHORTAGE', 'TABLE_ISSUE', 'GENERAL'] as const
    for (const type of types) {
      act(() => { result.current.setAlertType(type) })
      expect(result.current.alertType).toBe(type)
    }
  })
})

describe('useAlertForm — handleSendAlert validaciones', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna false si el mensaje está vacío', async () => {
    const { result } = renderHook(() => useAlertForm('rest-1'))
    let returnValue: boolean = true
    await act(async () => { returnValue = await result.current.handleSendAlert() })
    expect(returnValue).toBe(false)
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('retorna false si restaurantId es undefined', async () => {
    const { result } = renderHook(() => useAlertForm(undefined))
    act(() => { result.current.setAlertMsg('Ayuda') })
    let returnValue: boolean = true
    await act(async () => { returnValue = await result.current.handleSendAlert() })
    expect(returnValue).toBe(false)
  })

  it('retorna false si el mensaje es solo espacios', async () => {
    const { result } = renderHook(() => useAlertForm('rest-1'))
    act(() => { result.current.setAlertMsg('   ') })
    let returnValue: boolean = true
    await act(async () => { returnValue = await result.current.handleSendAlert() })
    expect(returnValue).toBe(false)
  })

  it('retorna true y llama sendAlert cuando los datos son válidos', async () => {
    const { result } = renderHook(() => useAlertForm('rest-1', 'user-1', 'garzon@test.cl'))
    act(() => {
      result.current.setAlertMsg('Necesito ayuda en la mesa')
      result.current.setTableNum('3')
    })
    let returnValue: boolean = false
    await act(async () => { returnValue = await result.current.handleSendAlert() })
    expect(returnValue).toBe(true)
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurant_id: 'rest-1',
        type: 'HELP_REQUEST',
        message: 'Necesito ayuda en la mesa',
        table_number: 3,
        status: 'PENDING',
      })
    )
  })

  it('retorna false si sendAlert falla', async () => {
    insertMock.mockResolvedValueOnce({ error: { message: 'DB error' } })
    const { result } = renderHook(() => useAlertForm('rest-1'))
    act(() => { result.current.setAlertMsg('Error test') })
    let returnValue: boolean = true
    await act(async () => { returnValue = await result.current.handleSendAlert() })
    expect(returnValue).toBe(false)
  })
})

describe('useAlertForm — reset', () => {
  it('reset restaura todos los campos al estado inicial', () => {
    const { result } = renderHook(() => useAlertForm('rest-1'))
    act(() => {
      result.current.setAlertType('TABLE_ISSUE')
      result.current.setAlertMsg('Problema en mesa')
      result.current.setTableNum('7')
    })
    act(() => { result.current.reset() })
    expect(result.current.alertType).toBe('HELP_REQUEST')
    expect(result.current.alertMsg).toBe('')
    expect(result.current.tableNum).toBe('')
    expect(result.current.sendingAlert).toBe(false)
    expect(result.current.alertSent).toBe(false)
  })
})

describe('useRealtimeAlerts — estructura', () => {
  it('retorna { alerts, loading, refetch }', async () => {
    const { result } = renderHook(() => useRealtimeAlerts('rest-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.alerts).toBeDefined()
    expect(typeof result.current.refetch).toBe('function')
  })

  it('retorna loading=false y alerts vacío sin restaurantId', async () => {
    const { result } = renderHook(() => useRealtimeAlerts(undefined))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.alerts).toEqual([])
  })
})
