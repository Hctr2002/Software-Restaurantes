import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoisted mocks — available before module imports
const { queryChain, insertMock } = vi.hoisted(() => {
  const insertMock = vi.fn().mockResolvedValue({ data: null, error: null })
  const updateMock = vi.fn()
  const selectAfterUpdate = vi.fn().mockResolvedValue({ data: [], error: null })
  const eqAfterUpdate = vi.fn().mockReturnValue({ select: selectAfterUpdate })
  updateMock.mockReturnValue({ eq: eqAfterUpdate })

  const singleMock = vi.fn().mockResolvedValue({ data: null, error: null })
  const eqChain = vi.fn()
  const queryChain: any = {}
  Object.assign(queryChain, {
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
    update: updateMock,
    insert: insertMock,
    eq: eqChain,
    in: vi.fn().mockReturnValue(queryChain),
    order: vi.fn().mockReturnValue(queryChain),
    limit: vi.fn().mockReturnValue(queryChain),
    single: singleMock,
    gte: vi.fn().mockReturnValue(queryChain),
    or: vi.fn().mockReturnValue(queryChain),
  })
  eqChain.mockReturnValue(queryChain)

  return { queryChain, insertMock }
})

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'tok' } } }),
      signOut: vi.fn().mockResolvedValue({}),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    from: vi.fn().mockReturnValue(queryChain),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockImplementation((cb: any) => { cb?.('SUBSCRIBED'); return {} }),
    }),
    removeChannel: vi.fn(),
    realtime: { setAuth: vi.fn() },
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://mock.co/img.jpg' } })),
      })),
    },
  })),
}))

import { updateOrderStatus, sendAlert, getAppMetadata } from '../index'

describe('updateOrderStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-apply implementations after clearAllMocks resets call tracking
    queryChain.update.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    })
  })

  it('incluye validated_at para estado VALIDATED', async () => {
    await updateOrderStatus('order-123', 'VALIDATED')
    expect(queryChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'VALIDATED',
        validated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      })
    )
  })

  it('incluye preparing_at para estado PREPARING', async () => {
    await updateOrderStatus('order-123', 'PREPARING')
    expect(queryChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PREPARING',
        preparing_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      })
    )
  })

  it('incluye ready_at para estado READY', async () => {
    await updateOrderStatus('order-123', 'READY')
    expect(queryChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'READY',
        ready_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      })
    )
  })

  it('no incluye timestamp para estado DELIVERED', async () => {
    await updateOrderStatus('order-123', 'DELIVERED')
    expect(queryChain.update).toHaveBeenCalledWith({ status: 'DELIVERED' })
  })

  it('no incluye timestamp para estado REJECTED', async () => {
    await updateOrderStatus('order-123', 'REJECTED')
    expect(queryChain.update).toHaveBeenCalledWith({ status: 'REJECTED' })
  })
})

describe('sendAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    insertMock.mockResolvedValue({ data: null, error: null })
  })

  it('inserta alerta con los campos correctos', async () => {
    await sendAlert({
      restaurantId: 'rest-1',
      userId: 'user-1',
      userEmail: 'garzon@test.com',
      type: 'HELP_REQUEST',
      message: 'Mesa 3 necesita ayuda',
      tableNumber: 3,
    })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurant_id: 'rest-1',
        user_id: 'user-1',
        user_email: 'garzon@test.com',
        type: 'HELP_REQUEST',
        message: 'Mesa 3 necesita ayuda',
        status: 'PENDING',
        table_number: 3,
      })
    )
  })

  it('usa null para campos opcionales no provistos', async () => {
    await sendAlert({
      restaurantId: 'rest-1',
      type: 'GENERAL',
      message: 'Aviso general',
    })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: null,
        user_email: null,
        table_number: null,
        menu_item_id: null,
        menu_item_name: null,
      })
    )
  })

  it('retorna { error } de la operación', async () => {
    const mockError = { message: 'DB error', code: '500' }
    insertMock.mockResolvedValueOnce({ data: null, error: mockError })

    const result = await sendAlert({
      restaurantId: 'rest-1',
      type: 'GENERAL',
      message: 'Test',
    })

    expect(result.error).toEqual(mockError)
  })

  it('incluye menuItemId y menuItemName cuando se proveen', async () => {
    await sendAlert({
      restaurantId: 'rest-1',
      type: 'STOCK_SHORTAGE',
      message: 'Sin stock de papas',
      menuItemId: 'item-42',
      menuItemName: 'Papas fritas',
    })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        menu_item_id: 'item-42',
        menu_item_name: 'Papas fritas',
      })
    )
  })
})

describe('getAppMetadata', () => {
  it('retorna app_metadata de la sesión', () => {
    const session = {
      user: { app_metadata: { role: 'GARZON', restaurant_id: 'rest-1' } },
    }
    expect(getAppMetadata(session)).toEqual({ role: 'GARZON', restaurant_id: 'rest-1' })
  })

  it('retorna {} para sesión null', () => {
    expect(getAppMetadata(null)).toEqual({})
  })

  it('retorna {} si la sesión no tiene user', () => {
    expect(getAppMetadata({})).toEqual({})
  })
})
