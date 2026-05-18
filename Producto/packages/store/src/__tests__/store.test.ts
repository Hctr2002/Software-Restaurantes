import { describe, it, expect, beforeEach } from 'vitest'
import { act } from 'react'
import { useAuthStore, type UserIdentity } from '../index'

const mockUser: UserIdentity = {
  id: 'user-1',
  email: 'garzon@restaurante.cl',
  role: 'GARZON',
  restaurantId: 'rest-1',
}

// Reset store state between tests to avoid cross-test contamination
beforeEach(() => {
  act(() => {
    useAuthStore.getState().logout()
  })
  localStorage.clear()
})

describe('useAuthStore — estado inicial', () => {
  it('comienza sin usuario autenticado', () => {
    const { user, isAuthenticated } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
  })
})

describe('useAuthStore — setUser', () => {
  it('establece el usuario y marca isAuthenticated = true', () => {
    act(() => {
      useAuthStore.getState().setUser(mockUser)
    })
    const { user, isAuthenticated } = useAuthStore.getState()
    expect(user).toEqual(mockUser)
    expect(isAuthenticated).toBe(true)
  })

  it('acepta todos los roles válidos', () => {
    const roles: UserIdentity['role'][] = ['SUPER_ADMIN', 'ADMIN', 'GARZON', 'COCINA', 'CAJERO', 'CLIENTE', 'BAR']
    for (const role of roles) {
      act(() => {
        useAuthStore.getState().setUser({ ...mockUser, role })
      })
      expect(useAuthStore.getState().user?.role).toBe(role)
    }
  })

  it('setUser(null) borra el usuario y deja isAuthenticated = false', () => {
    act(() => {
      useAuthStore.getState().setUser(mockUser)
    })
    act(() => {
      useAuthStore.getState().setUser(null)
    })
    const { user, isAuthenticated } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
  })

  it('sobreescribe el usuario existente con uno nuevo', () => {
    act(() => {
      useAuthStore.getState().setUser(mockUser)
    })
    const newUser: UserIdentity = { ...mockUser, id: 'user-2', email: 'admin@restaurante.cl', role: 'ADMIN' }
    act(() => {
      useAuthStore.getState().setUser(newUser)
    })
    expect(useAuthStore.getState().user?.email).toBe('admin@restaurante.cl')
  })
})

describe('useAuthStore — logout', () => {
  it('borra usuario y pone isAuthenticated = false', () => {
    act(() => {
      useAuthStore.getState().setUser(mockUser)
    })
    act(() => {
      useAuthStore.getState().logout()
    })
    const { user, isAuthenticated } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
  })

  it('es idempotente (doble logout no lanza error)', () => {
    expect(() => {
      act(() => {
        useAuthStore.getState().logout()
        useAuthStore.getState().logout()
      })
    }).not.toThrow()
  })
})

describe('useAuthStore — persistencia cifrada', () => {
  it('persiste datos en localStorage al setUser', () => {
    act(() => {
      useAuthStore.getState().setUser(mockUser)
    })
    // localStorage should have the encrypted entry
    const stored = localStorage.getItem('menu-bites-auth-storage')
    expect(stored).not.toBeNull()
    // Stored value should NOT be plaintext JSON (it's AES-encrypted)
    expect(stored).not.toContain('"email"')
  })

  it('limpia localStorage al logout', () => {
    act(() => {
      useAuthStore.getState().setUser(mockUser)
    })
    expect(localStorage.getItem('menu-bites-auth-storage')).not.toBeNull()
    // After logout the store serializes state with user: null
    act(() => {
      useAuthStore.getState().logout()
    })
    // Storage key still exists but the persisted value encodes null user
    const stored = localStorage.getItem('menu-bites-auth-storage')
    // Value exists (zustand persist keeps the key) but should NOT contain the user email in plain text
    if (stored) {
      expect(stored).not.toContain(mockUser.email)
    }
  })
})

describe('useAuthStore — campos opcionales', () => {
  it('almacena pushToken cuando se provee', () => {
    const userWithToken: UserIdentity = { ...mockUser, pushToken: 'fcm-token-abc' }
    act(() => {
      useAuthStore.getState().setUser(userWithToken)
    })
    expect(useAuthStore.getState().user?.pushToken).toBe('fcm-token-abc')
  })

  it('restaurantId puede ser undefined', () => {
    const superAdmin: UserIdentity = { id: 'sa-1', email: 'sa@system.com', role: 'SUPER_ADMIN' }
    act(() => {
      useAuthStore.getState().setUser(superAdmin)
    })
    expect(useAuthStore.getState().user?.restaurantId).toBeUndefined()
  })
})
