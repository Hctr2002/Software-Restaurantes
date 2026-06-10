/**
 * Tests de lib/pushNotifications.ts — registro/limpieza del token de push.
 * Mockea expo-notifications/device/constants, react-native y ./supabase.
 * El módulo lee Constants.executionEnvironment al importar → import dinámico por caso.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const s = vi.hoisted(() => ({
  executionEnvironment: 'standalone',
  isDevice: true,
  permission: 'granted',
  platformOS: 'ios',
  updateCalls: [] as any[],
}))

vi.mock('react-native', () => ({ Platform: { get OS() { return s.platformOS } } }))
vi.mock('expo-device', () => ({ get isDevice() { return s.isDevice } }))
vi.mock('expo-constants', () => ({
  default: {
    get executionEnvironment() { return s.executionEnvironment },
    expoConfig: { extra: { eas: { projectId: 'proj-1' } } },
    easConfig: {},
  },
}))
vi.mock('expo-notifications', () => ({
  setNotificationHandler: vi.fn(),
  getPermissionsAsync: vi.fn(async () => ({ status: s.permission })),
  requestPermissionsAsync: vi.fn(async () => ({ status: s.permission })),
  setNotificationChannelAsync: vi.fn(async () => {}),
  getExpoPushTokenAsync: vi.fn(async () => ({ data: 'ExpoToken[abc]' })),
  AndroidImportance: { MAX: 5 },
}))
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      update: (payload: any) => ({
        eq: async (col: string, val: string) => {
          s.updateCalls.push({ payload, col, val })
          return { error: null }
        },
      }),
    }),
  },
}))

async function load() {
  vi.resetModules()
  vi.stubGlobal('__DEV__', false)
  return await import('../lib/pushNotifications')
}

beforeEach(() => {
  s.executionEnvironment = 'standalone'
  s.isDevice = true
  s.permission = 'granted'
  s.platformOS = 'ios'
  s.updateCalls = []
})

describe('registerPushToken', () => {
  it('no hace nada en Expo Go', async () => {
    s.executionEnvironment = 'storeClient'
    const { registerPushToken } = await load()
    await registerPushToken('u1')
    expect(s.updateCalls).toHaveLength(0)
  })

  it('no hace nada si no es un dispositivo físico', async () => {
    s.isDevice = false
    const { registerPushToken } = await load()
    await registerPushToken('u1')
    expect(s.updateCalls).toHaveLength(0)
  })

  it('no guarda token si se deniegan los permisos', async () => {
    s.permission = 'denied'
    const { registerPushToken } = await load()
    await registerPushToken('u1')
    expect(s.updateCalls).toHaveLength(0)
  })

  it('obtiene y persiste el token cuando hay permisos', async () => {
    const { registerPushToken } = await load()
    await registerPushToken('u1')
    expect(s.updateCalls).toHaveLength(1)
    expect(s.updateCalls[0]).toMatchObject({ payload: { push_token: 'ExpoToken[abc]' }, col: 'id', val: 'u1' })
  })
})

describe('clearPushToken', () => {
  it('pone push_token en null para el usuario', async () => {
    const { clearPushToken } = await load()
    await clearPushToken('u1')
    expect(s.updateCalls[0]).toMatchObject({ payload: { push_token: null }, col: 'id', val: 'u1' })
  })
})
