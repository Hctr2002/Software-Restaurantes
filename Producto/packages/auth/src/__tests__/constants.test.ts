import { describe, it, expect } from 'vitest'
import {
  LOW_STOCK_THRESHOLD,
  CRITICAL_STOCK_THRESHOLD,
  STALE_ORDER_MINUTES,
  ORDER_STATUS_LABEL,
  TABLE_STATUS_LABEL,
} from '../constants'

describe('Umbrales operativos', () => {
  it('LOW_STOCK_THRESHOLD es 5', () => {
    expect(LOW_STOCK_THRESHOLD).toBe(5)
  })

  it('CRITICAL_STOCK_THRESHOLD es 5', () => {
    expect(CRITICAL_STOCK_THRESHOLD).toBe(5)
  })

  it('STALE_ORDER_MINUTES es 3', () => {
    expect(STALE_ORDER_MINUTES).toBe(3)
  })
})

describe('ORDER_STATUS_LABEL', () => {
  it('cubre todos los estados del flujo de pedido', () => {
    expect(ORDER_STATUS_LABEL['PENDING']).toBe('Solicitado')
    expect(ORDER_STATUS_LABEL['VALIDATED']).toBe('Confirmado')
    expect(ORDER_STATUS_LABEL['PREPARING']).toBe('En preparación')
    expect(ORDER_STATUS_LABEL['READY']).toBe('Listo')
    expect(ORDER_STATUS_LABEL['DELIVERED']).toBe('Entregado')
    expect(ORDER_STATUS_LABEL['REJECTED']).toBe('Rechazado')
  })

  it('no tiene etiqueta para estados desconocidos', () => {
    expect(ORDER_STATUS_LABEL['UNKNOWN']).toBeUndefined()
  })
})

describe('TABLE_STATUS_LABEL', () => {
  it('cubre todos los estados de mesa', () => {
    expect(TABLE_STATUS_LABEL['FREE']).toBe('Libre')
    expect(TABLE_STATUS_LABEL['OCCUPIED']).toBe('Ocupada')
    expect(TABLE_STATUS_LABEL['RESERVED']).toBe('Reservada')
    expect(TABLE_STATUS_LABEL['CLEANING']).toBe('Limpieza')
  })
})
