/**
 * Tests de lib/receipt.ts — generación del HTML del recibo y flujo de compartir.
 * Se mockean expo-print y expo-sharing; verificamos el HTML capturado por printToFileAsync.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const printMock = vi.fn().mockResolvedValue({ uri: 'file:///recibo.pdf' })
const isAvailableMock = vi.fn().mockResolvedValue(true)
const shareMock = vi.fn().mockResolvedValue(undefined)

vi.mock('expo-print', () => ({ printToFileAsync: (...a: any[]) => printMock(...a) }))
vi.mock('expo-sharing', () => ({
  isAvailableAsync: () => isAvailableMock(),
  shareAsync: (...a: any[]) => shareMock(...a),
}))

import { shareReceipt } from '../lib/receipt'

const baseData = {
  tableLabel: 'Mesa 5',
  restaurantName: 'La Parrilla',
  items: [
    { name: 'Lomo', quantity: 2, unitPrice: 8000 },
    { name: 'Bebida', quantity: 1, unitPrice: 2000 },
  ],
}

async function htmlFor(data: any): Promise<string> {
  await shareReceipt(data)
  return printMock.mock.calls.at(-1)![0].html as string
}

beforeEach(() => {
  vi.clearAllMocks()
  isAvailableMock.mockResolvedValue(true)
})

describe('shareReceipt — HTML', () => {
  it('incluye nombre del local, mesa y filas de ítems', async () => {
    const html = await htmlFor(baseData)
    expect(html).toContain('La Parrilla')
    expect(html).toContain('Mesa 5')
    expect(html).toContain('2x Lomo')
    expect(html).toContain('1x Bebida')
  })

  it('sin propina no muestra la sección PROPINA', async () => {
    const html = await htmlFor(baseData)
    expect(html).not.toContain('PROPINA')
  })

  it('con propina muestra la sección PROPINA 10%', async () => {
    const html = await htmlFor({ ...baseData, tipIncluded: true })
    expect(html).toContain('PROPINA')
  })

  it('escapa caracteres especiales del nombre', async () => {
    const html = await htmlFor({ ...baseData, restaurantName: 'Bar & Grill <X>' })
    expect(html).toContain('Bar &amp; Grill &lt;X&gt;')
    expect(html).not.toContain('Bar & Grill <X>')
  })

  it('muestra la referencia cuando se entrega', async () => {
    const html = await htmlFor({ ...baseData, reference: 'TRX-99' })
    expect(html).toContain('Referencia: TRX-99')
  })
})

describe('shareReceipt — compartir', () => {
  it('comparte el PDF cuando Sharing está disponible', async () => {
    await shareReceipt(baseData)
    expect(shareMock).toHaveBeenCalledTimes(1)
    expect(shareMock.mock.calls[0][0]).toBe('file:///recibo.pdf')
  })

  it('no comparte cuando Sharing no está disponible', async () => {
    isAvailableMock.mockResolvedValue(false)
    await shareReceipt(baseData)
    expect(shareMock).not.toHaveBeenCalled()
  })
})
