import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { effectiveTip } from './tip';

interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface ReceiptData {
  tableLabel: string;
  restaurantName?: string;
  items: ReceiptItem[];
  /** Monto de propina en pesos (0 = sin propina). */
  tipAmount?: number;
  reference?: string;
  date?: Date;
}

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildHtml(data: ReceiptData): string {
  const { tableLabel, restaurantName, items, tipAmount: rawTip, reference, date = new Date() } = data;

  // Consolidar ítems por nombre (paridad con la boleta web).
  const consolidated = Object.values(
    items.reduce((acc, i) => {
      acc[i.name] = acc[i.name] ?? { name: i.name, quantity: 0, amount: 0 };
      acc[i.name].quantity += i.quantity;
      acc[i.name].amount += i.unitPrice * i.quantity;
      return acc;
    }, {} as Record<string, { name: string; quantity: number; amount: number }>),
  );

  const subtotal = consolidated.reduce((s, i) => s + i.amount, 0);
  const neto = Math.round(subtotal / 1.19);
  const iva = subtotal - neto;
  const tipAmount = Math.max(0, Math.round(rawTip || 0));
  const tipPct = subtotal > 0 ? Math.round((tipAmount / subtotal) * 100) : 0;
  const total = subtotal + tipAmount;
  const dateStr = date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const rows = consolidated
    .map(
      i => `
      <tr>
        <td style="padding:8px 0;color:#e2e8f0;">${i.quantity}x ${esc(i.name)}</td>
        <td style="padding:8px 0;text-align:right;color:#f7f4f3;font-weight:700;">${formatCLP(i.amount)}</td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#0A1128; color:#f7f4f3; font-family:-apple-system,Arial,sans-serif; padding:32px 24px; max-width:420px; margin:0 auto; }
    .logo { text-align:center; margin-bottom:24px; }
    .logo h1 { font-size:24px; font-weight:900; font-style:italic; letter-spacing:1px; }
    .logo h1 span { color:#FE5F55; }
    .divider { border:none; border-top:1px dashed rgba(255,255,255,0.15); margin:16px 0; }
    .meta { margin-bottom:16px; }
    .meta p { font-size:13px; color:rgba(255,255,255,0.5); line-height:1.8; }
    .meta p strong { color:#f7f4f3; }
    table { width:100%; border-collapse:collapse; margin-bottom:8px; }
    .section-title { font-size:10px; font-weight:900; letter-spacing:2px; color:rgba(255,255,255,0.4); margin:16px 0 8px; }
    .total-row { display:flex; justify-content:space-between; align-items:center; padding:16px 0 8px; }
    .total-label { font-size:12px; font-weight:900; letter-spacing:2px; color:rgba(255,255,255,0.5); }
    .total-value { font-size:32px; font-weight:900; font-style:italic; color:#f7f4f3; }
    .ref { margin-top:12px; font-size:12px; color:rgba(255,255,255,0.4); }
    .footer { margin-top:32px; text-align:center; font-size:11px; color:rgba(255,255,255,0.25); line-height:1.8; }
  </style>
</head>
<body>
  <div class="logo">
    <h1>Menu <span>Bites</span></h1>
    ${restaurantName ? `<p style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;">${esc(restaurantName)}</p>` : ''}
  </div>

  <hr class="divider"/>

  <div class="meta">
    <p><strong>${esc(tableLabel)}</strong></p>
    <p>${dateStr}</p>
  </div>

  <hr class="divider"/>

  <p class="section-title">DETALLE DEL PEDIDO</p>
  <table>
    <tbody>${rows}</tbody>
  </table>

  <hr class="divider"/>

  <div style="display:flex;justify-content:space-between;padding:6px 0;color:rgba(255,255,255,0.55);font-size:13px;">
    <span>NETO</span><span>${formatCLP(neto)}</span>
  </div>
  <div style="display:flex;justify-content:space-between;padding:6px 0;color:rgba(255,255,255,0.55);font-size:13px;">
    <span>IVA (19%)</span><span>${formatCLP(iva)}</span>
  </div>
  <div style="display:flex;justify-content:space-between;padding:6px 0;color:#f7f4f3;font-size:13px;font-weight:700;">
    <span>TOTAL CONSUMO</span><span>${formatCLP(subtotal)}</span>
  </div>

  ${tipAmount > 0 ? `
  <div style="display:flex;justify-content:space-between;padding:8px 0;color:#FFD700;">
    <span style="font-size:11px;font-weight:900;letter-spacing:1px;">PROPINA ${tipPct}%</span>
    <span style="font-size:14px;font-weight:900;">+${formatCLP(tipAmount)}</span>
  </div>` : ''}

  <div class="total-row">
    <span class="total-label">${tipAmount > 0 ? 'TOTAL A PAGAR (propina incluida)' : 'TOTAL A PAGAR'}</span>
    <span class="total-value">${formatCLP(total)}</span>
  </div>

  ${reference ? `<p class="ref">Referencia: ${esc(reference)}</p>` : ''}

  <hr class="divider" style="margin-top:24px;"/>
  <div class="footer">
    <p>Gracias por tu visita</p>
    <p>Powered by Menu Bites</p>
  </div>
</body>
</html>`;
}

/**
 * Construye los datos de la boleta a partir de un grupo de cobro de la caja
 * (mismas mesas/sesión). Usa la propina efectiva (monto real o fallback 10%).
 */
export function receiptDataFromGroup(
  group: any,
  opts: { restaurantName?: string; reference?: string } = {},
): ReceiptData {
  const items: ReceiptItem[] = (group?.orders ?? [])
    .flatMap((o: any) => o.order_items ?? [])
    .map((i: any) => ({
      name: i.menu_items?.name ?? 'Ítem',
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
    }));
  return {
    tableLabel: group?.sessionId ? 'Mesas fusionadas' : `Mesa ${group?.tableNumber ?? 'S/N'}`,
    items,
    tipAmount: effectiveTip(group?.total ?? 0, group?.tipIncluded, group?.tipAmount),
    restaurantName: opts.restaurantName,
    reference: opts.reference,
  };
}

export async function shareReceipt(data: ReceiptData): Promise<void> {
  const html = buildHtml(data);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Recibo ${data.tableLabel}`,
      UTI: 'com.adobe.pdf',
    });
  }
}
