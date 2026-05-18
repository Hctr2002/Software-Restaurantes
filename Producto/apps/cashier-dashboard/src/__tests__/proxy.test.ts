/**
 * Tests for src/proxy.ts — cashier-dashboard authentication middleware.
 *
 * Scenarios:
 * - Public routes (/auth/callback, /receipt/*) bypass auth entirely
 * - No session → redirect to AUTH_URL
 * - Session present but role ≠ CAJERO → redirect
 * - Role passed as array → normalised correctly
 * - Valid CAJERO session → passes through (NextResponse.next)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Mock @supabase/ssr ───────────────────────────────────────────────────────
const mockCreateServerClient = vi.hoisted(() => vi.fn())
vi.mock('@supabase/ssr', () => ({ createServerClient: mockCreateServerClient }))

import { proxy } from '../proxy'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeReq(path: string): NextRequest {
  return new NextRequest(`http://localhost:3004${path}`)
}

function setupSession(session: any) {
  mockCreateServerClient.mockReturnValue({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session } }) },
  })
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  process.env.NEXT_PUBLIC_AUTH_URL = 'http://localhost:3000'
})

// ─────────────────────────────────────────────────────────────────────────────
// Rutas públicas — bypass total de autenticación
// ─────────────────────────────────────────────────────────────────────────────
describe('proxy — rutas públicas', () => {
  it('deja pasar /auth/callback sin verificar sesión', async () => {
    const res = await proxy(makeReq('/auth/callback'))
    expect(res.status).toBe(200)
    expect(mockCreateServerClient).not.toHaveBeenCalled()
  })

  it('deja pasar /receipt/table/t-1 sin verificar sesión', async () => {
    const res = await proxy(makeReq('/receipt/table/t-1'))
    expect(res.status).toBe(200)
    expect(mockCreateServerClient).not.toHaveBeenCalled()
  })

  it('deja pasar /receipt/session/s-1 sin verificar sesión', async () => {
    const res = await proxy(makeReq('/receipt/session/s-1'))
    expect(res.status).toBe(200)
    expect(mockCreateServerClient).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Sin sesión → redirección al portal de auth
// ─────────────────────────────────────────────────────────────────────────────
describe('proxy — sin sesión activa', () => {
  it('redirige al AUTH_URL cuando no hay sesión', async () => {
    setupSession(null)
    const res = await proxy(makeReq('/'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('localhost:3000')
  })

  it('redirige desde cualquier ruta protegida', async () => {
    setupSession(null)
    const res = await proxy(makeReq('/dashboard'))
    expect(res.status).toBe(307)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Sesión con rol incorrecto → redirección
// ─────────────────────────────────────────────────────────────────────────────
describe('proxy — rol incorrecto', () => {
  it('redirige cuando el rol es ADMIN (no CAJERO)', async () => {
    setupSession({ user: { app_metadata: { role: 'ADMIN' } } })
    const res = await proxy(makeReq('/'))
    expect(res.status).toBe(307)
  })

  it('redirige cuando el rol es GARZON', async () => {
    setupSession({ user: { app_metadata: { role: 'GARZON' } } })
    const res = await proxy(makeReq('/'))
    expect(res.status).toBe(307)
  })

  it('redirige cuando no hay rol definido', async () => {
    setupSession({ user: { app_metadata: {} } })
    const res = await proxy(makeReq('/'))
    expect(res.status).toBe(307)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Sesión válida con rol CAJERO → deja pasar
// ─────────────────────────────────────────────────────────────────────────────
describe('proxy — sesión CAJERO válida', () => {
  it('deja pasar cuando role es "CAJERO"', async () => {
    setupSession({ user: { app_metadata: { role: 'CAJERO' } } })
    const res = await proxy(makeReq('/'))
    expect(res.status).toBe(200)
  })

  it('deja pasar cuando role es "cajero" (minúsculas)', async () => {
    setupSession({ user: { app_metadata: { role: 'cajero' } } })
    const res = await proxy(makeReq('/'))
    expect(res.status).toBe(200)
  })

  it('deja pasar cuando role está en un array ["CAJERO"]', async () => {
    setupSession({ user: { app_metadata: { role: ['CAJERO'] } } })
    const res = await proxy(makeReq('/'))
    expect(res.status).toBe(200)
  })

  it('deja pasar en rutas anidadas como /[slug]', async () => {
    setupSession({ user: { app_metadata: { role: 'CAJERO' } } })
    const res = await proxy(makeReq('/mi-restaurante'))
    expect(res.status).toBe(200)
  })
})
