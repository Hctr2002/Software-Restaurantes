// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// Mockeamos el motor de sonido para inspeccionar con qué `count` se invoca.
const mocks = vi.hoisted(() => ({
  useNotificationSound: vi.fn(() => ({ audioBlocked: false, enableAudio: () => {} })),
}))
vi.mock('@menu-bites/ui', () => ({ useNotificationSound: mocks.useNotificationSound }))

import { useWebPush } from '../hooks/useWebPush'

/**
 * Regresión del bug "no suena en la pantalla del garzón al llegar un llamado":
 * el sonido se dispara cuando aumenta `count`, y `count` debe incluir los
 * llamados de garzón (help_requested), no solo pedidos y cuentas.
 */
describe('useWebPush — count que dispara el sonido', () => {
  beforeEach(() => mocks.useNotificationSound.mockClear())

  it('incluye los llamados de garzón (help) en el count', () => {
    renderHook(() => useWebPush('r1', [], [], 0, 3))
    expect(mocks.useNotificationSound).toHaveBeenCalledWith({ count: 3 })
  })

  it('suma ready + pending + bill + help', () => {
    // 2 ready + 1 pending + 4 cuentas + 3 llamados = 10
    renderHook(() => useWebPush('r1', [{}, {}] as any, [{}] as any, 4, 3))
    expect(mocks.useNotificationSound).toHaveBeenCalledWith({ count: 10 })
  })

  it('sin llamados de garzón el count no se ve afectado', () => {
    renderHook(() => useWebPush('r1', [], [], 2, 0))
    expect(mocks.useNotificationSound).toHaveBeenCalledWith({ count: 2 })
  })
})
