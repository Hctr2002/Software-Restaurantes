import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface ReceiptData {
  tableLabel: string;
  restaurantName?: string;
  items: ReceiptItem[];
  reference?: string;
  date?: Date;
}

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
}

function buildHtml(data: ReceiptData): string {
  const { tableLabel, restaurantName, items, reference, date = new Date() } = data;

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const dateStr = date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const rows = items
    .map(
      i => `
      <tr>
        <td style="padding:8px 0;color:#e2e8f0;">${i.quantity}x ${i.name}</td>
        <td style="padding:8px 0;text-align:right;color:#f7f4f3;font-weight:700;">${formatCLP(i.unitPrice * i.quantity)}</td>
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
    ${restaurantName ? `<p style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;">${restaurantName}</p>` : ''}
  </div>

  <hr class="divider"/>

  <div class="meta">
    <p><strong>${tableLabel}</strong></p>
    <p>${dateStr}</p>
  </div>

  <hr class="divider"/>

  <p class="section-title">DETALLE DEL PEDIDO</p>
  <table>
    <tbody>${rows}</tbody>
  </table>

  <hr class="divider"/>

  <div class="total-row">
    <span class="total-label">TOTAL</span>
    <span class="total-value">${formatCLP(subtotal)}</span>
  </div>

  ${reference ? `<p class="ref">Referencia: ${reference}</p>` : ''}

  <hr class="divider" style="margin-top:24px;"/>
  <div class="footer">
    <p>Gracias por tu visita</p>
    <p>Powered by Menu Bites</p>
  </div>
</body>
</html>`;
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
