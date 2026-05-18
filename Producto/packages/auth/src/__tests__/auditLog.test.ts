import { describe, it, expect, vi, beforeEach } from 'vitest'

const { insertMock } = vi.hoisted(() => {
  const insertMock = vi.fn().mockResolvedValue({ error: null })
  return { insertMock }
})

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: vi.fn(() => ({ insert: insertMock })),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
    realtime: { setAuth: vi.fn() },
    storage: { from: vi.fn().mockReturnValue({ getPublicUrl: vi.fn() }) },
  })),
}))

import { logBarAction } from '../auditLog'

describe('logBarAction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserta en audit_logs con el payload correcto', async () => {
    await logBarAction('rest-1', 'user-1', 'STOCK_MARKED_OUT', { itemId: 'item-99', reason: 'Sin stock' })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurant_id: 'rest-1',
        user_id: 'user-1',
        action: 'STOCK_MARKED_OUT',
        details: { itemId: 'item-99', reason: 'Sin stock' },
        created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      })
    )
  })

  it('usa null para userId cuando es undefined', async () => {
    await logBarAction('rest-1', undefined, 'ALERT_SENT', {})
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ user_id: null }))
  })

  it('soporta todos los tipos de acción de auditoría', async () => {
    const actions = ['STOCK_MARKED_OUT', 'STOCK_RESTORED', 'SETTINGS_UPDATED', 'ALERT_SENT'] as const
    for (const action of actions) {
      await logBarAction('rest-1', 'user-1', action, {})
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ action }))
    }
  })

  it('no lanza excepción cuando supabase retorna error', async () => {
    insertMock.mockResolvedValueOnce({ error: { message: 'tabla no existe' } })
    await expect(logBarAction('rest-1', 'user-1', 'ALERT_SENT', {})).resolves.not.toThrow()
  })

  it('registra advertencia en consola cuando hay error', async () => {
    insertMock.mockResolvedValueOnce({ error: { message: 'forbidden' } })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await logBarAction('rest-1', 'user-1', 'SETTINGS_UPDATED', {})
    expect(warnSpy).toHaveBeenCalledWith('[auditLog] Error al registrar acción:', 'forbidden')
    warnSpy.mockRestore()
  })

  it('incluye timestamp ISO en created_at', async () => {
    const before = new Date().toISOString()
    await logBarAction('rest-1', 'user-1', 'STOCK_RESTORED', {})
    const after = new Date().toISOString()
    const { created_at } = insertMock.mock.calls[0][0] as any
    expect(new Date(created_at).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime())
    expect(new Date(created_at).getTime()).toBeLessThanOrEqual(new Date(after).getTime())
  })
})
