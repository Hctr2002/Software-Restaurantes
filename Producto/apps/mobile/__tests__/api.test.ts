/**
 * Tests de lib/api.ts — getApiUrl (descubrimiento de URL de API por entorno).
 * Las constantes de módulo invocan getApiUrl al importar y el código lee __DEV__,
 * por eso definimos el global y recargamos el módulo dinámicamente en cada caso.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { constantsState } = vi.hoisted(() => ({ constantsState: { hostUri: '' } }))

vi.mock('expo-constants', () => ({
  default: {
    get expoConfig() {
      return { hostUri: constantsState.hostUri }
    },
  },
}))
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }))

async function loadGetApiUrl(dev: boolean, hostUri = '') {
  vi.resetModules()
  vi.stubGlobal('__DEV__', dev)
  constantsState.hostUri = hostUri
  const mod = await import('../lib/api')
  return mod.getApiUrl
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('getApiUrl', () => {
  it('prioriza una URL de producción explícita (no localhost)', async () => {
    const getApiUrl = await loadGetApiUrl(false)
    expect(getApiUrl(3000, 'https://api.midominio.com')).toBe('https://api.midominio.com')
  })

  it('en producción sin override usa el dominio por defecto', async () => {
    const getApiUrl = await loadGetApiUrl(false)
    expect(getApiUrl(3000)).toBe('https://api.menubites.com')
  })

  it('en desarrollo (iOS) usa localhost con el puerto dado', async () => {
    const getApiUrl = await loadGetApiUrl(true)
    expect(getApiUrl(3003)).toBe('http://localhost:3003')
  })

  it('en desarrollo respeta una IP LAN provista en customEnvUrl', async () => {
    const getApiUrl = await loadGetApiUrl(true)
    expect(getApiUrl(3003, 'http://192.168.1.50:3003')).toBe('http://192.168.1.50:3003')
  })

  it('en desarrollo deriva el host del debuggerHost de Expo', async () => {
    const getApiUrl = await loadGetApiUrl(true, '192.168.0.9:8081')
    expect(getApiUrl(3005)).toBe('http://192.168.0.9:3005')
  })
})
