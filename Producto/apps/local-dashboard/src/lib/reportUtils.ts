/**
 * reportUtils — Funciones de cálculo, procesamiento y exportación para la sección de Reportes.
 * Procesa órdenes brutas en estructuras diarias, por ítem, por mesa y por garzón.
 */

/**
 * Calcula la diferencia en minutos entre dos timestamps ISO.
 * Retorna null si alguno de los valores es nulo o indefinido.
 */
export function diffMinutes(a: string | null | undefined, b: string | null | undefined): number | null {
  if (!a || !b) return null;
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}

/** Promedia un arreglo de números. Retorna 0 si el arreglo está vacío. */
export function avgOrNull(vals: number[]): number {
  if (!vals.length) return 0;
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

/** Retorna la fecha de hoy en formato ISO YYYY-MM-DD (hora local). */
export function todayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retorna la fecha de hace n días en formato ISO YYYY-MM-DD.
 * @param n - Número de días hacia atrás (1 = ayer).
 */
export function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Formatea un ISO date a texto corto localizado en es-CL (ej: "lun. 15/05"). */
export function formatShortDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-CL", {
    weekday: "short", day: "2-digit", month: "2-digit",
  });
}

/**
 * Retorna la clase Tailwind del color de medalla según posición en el ranking.
 * @param i - Índice base-0 (0=oro, 1=plata, 2=bronce).
 */
export function medalColor(i: number) {
  if (i === 0) return "text-yellow-400";
  if (i === 1) return "text-slate-300";
  if (i === 2) return "text-amber-600";
  return "text-foreground/40";
}

export function orderItemTotal(it: any): number {
  return Number(it.unitPrice ?? 0) * (it.quantity ?? 1);
}

/**
 * Agrupa las órdenes por día dentro del rango [from, to] y calcula
 * pedidos, ingresos y ticket promedio para cada fecha.
 */
export function processDailyReports(orders: any[], from: string, to: string) {
  const dayMap: Record<string, { orders: number; revenue: number }> = {};
  const cursor = new Date(from + "T12:00:00");
  const toDate = new Date(to + "T12:00:00");
  
  while (cursor <= toDate) {
    dayMap[cursor.toISOString().slice(0, 10)] = { orders: 0, revenue: 0 };
    cursor.setDate(cursor.getDate() + 1);
  }

  orders.forEach((order) => {
    const key = order.createdAt.slice(0, 10);
    if (!dayMap[key]) return;
    const total = (order.order_items ?? []).reduce((s: number, it: any) => s + orderItemTotal(it), 0);
    dayMap[key].orders++;
    dayMap[key].revenue += total;
  });

  return Object.entries(dayMap).map(([date, v]) => ({
    date,
    orders: v.orders,
    revenue: v.revenue,
    avg: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0,
  }));
}

/** Extrae los 10 ítems más pedidos con su conteo e ingresos totales. */
export function processTopItems(orders: any[]) {
  const itemMap: Record<string, { count: number; revenue: number }> = {};
  orders.forEach((order) => {
    (order.order_items ?? []).forEach((it: any) => {
      const name = it.menu_items?.name;
      if (!name) return;
      if (!itemMap[name]) itemMap[name] = { count: 0, revenue: 0 };
      itemMap[name].count++;
      itemMap[name].revenue += orderItemTotal(it);
    });
  });

  return Object.entries(itemMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/** Agrupa ingresos y pedidos por número de mesa, ordenados por mayor ingreso. */
export function processTableReports(orders: any[]) {
  const tblMap: Record<number, { orders: number; revenue: number }> = {};
  orders.forEach((order) => {
    const num = order.tables?.number;
    if (!num) return;
    if (!tblMap[num]) tblMap[num] = { orders: 0, revenue: 0 };
    const total = (order.order_items ?? []).reduce((s: number, it: any) => s + orderItemTotal(it), 0);
    tblMap[num].orders++;
    tblMap[num].revenue += total;
  });

  return Object.entries(tblMap)
    .map(([number, v]) => ({ number: Number(number), ...v }))
    .sort((a, b) => b.revenue - a.revenue);
}

/** Agrupa ingresos y pedidos por email de garzón, ordenados por mayor ingreso. */
export function processStaffReports(orders: any[]) {
  const garzonMap: Record<string, { orders: number; revenue: number }> = {};
  orders.forEach((order) => {
    const email = order.users?.email;
    if (!email) return;
    if (!garzonMap[email]) garzonMap[email] = { orders: 0, revenue: 0 };
    const total = (order.order_items ?? []).reduce((s: number, it: any) => s + orderItemTotal(it), 0);
    garzonMap[email].orders++;
    garzonMap[email].revenue += total;
  });

  return Object.entries(garzonMap)
    .map(([email, v]) => ({ email, ...v }))
    .sort((a, b) => b.revenue - a.revenue);
}

// ─── XML export helpers ───────────────────────────────────────────────────────────────

function esc(v: string | number): string {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function xmlCell(value: string | number, type: "String" | "Number" = "String"): string {
  const t = typeof value === "number" ? "Number" : type;
  return `<Cell><Data ss:Type="${t}">${esc(value)}</Data></Cell>`;
}

function xmlRow(cells: Array<string | number>): string {
  return `<Row>${cells.map((c) => xmlCell(c, typeof c === "number" ? "Number" : "String")).join("")}</Row>`;
}

function xmlHeaderRow(headers: string[]): string {
  return `<Row>${headers.map((h) => `<Cell ss:StyleID="header"><Data ss:Type="String">${esc(h)}</Data></Cell>`).join("")}</Row>`;
}

function xmlSheet(name: string, headers: string[], rows: Array<Array<string | number>>): string {
  return `
  <Worksheet ss:Name="${esc(name)}">
    <Table>
      ${xmlHeaderRow(headers)}
      ${rows.map(xmlRow).join("\n      ")}
    </Table>
  </Worksheet>`;
}

/**
 * Construye el XML completo en formato SpreadsheetML (compatible con Excel)
 * con cuatro hojas: ventas diarias, ranking de garzones, top ítems y mesas.
 */
export function buildSpreadsheetML(
  periodLabel: string,
  daily: any[],
  garzones: any[],
  items: any[],
  tables: any[],
): string {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#111111" ss:Pattern="Solid"/>
      <Font ss:Color="#FFFFFF" ss:Bold="1"/>
    </Style>
  </Styles>`;

  const sheetDaily = xmlSheet(
    "Ventas por Día",
    ["Fecha", "Pedidos", "Ingresos (CLP)", "Ticket Promedio (CLP)"],
    daily.map((r) => [r.date, r.orders, r.revenue, r.avg]),
  );

  const sheetGarzones = xmlSheet(
    "Ranking Garzones",
    ["#", "Garzón (email)", "Pedidos atendidos", "Ingresos generados (CLP)"],
    garzones.map((r, i) => [i + 1, r.email, r.orders, r.revenue]),
  );

  const sheetItems = xmlSheet(
    "Top Items",
    ["#", "Plato", "Veces pedido", "Ingresos generados (CLP)"],
    items.map((r, i) => [i + 1, r.name, r.count, r.revenue]),
  );

  const sheetTables = xmlSheet(
    "Ingresos por Mesa",
    ["Mesa", "Pedidos", "Ingresos totales (CLP)"],
    tables.map((r) => [`Mesa ${r.number}`, r.orders, r.revenue]),
  );

  return `${header}${sheetDaily}${sheetGarzones}${sheetItems}${sheetTables}\n</Workbook>`;
}

/**
 * Dispara la descarga del contenido XML como archivo en el navegador.
 * @param content - XML como string.
 * @param filename - Nombre del archivo a descargar.
 */
export function downloadXML(content: string, filename: string) {
  const blob = new Blob([content], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Calcula los promedios de tiempos de cocina agrupados por categoría.
 * Requiere que las órdenes tengan timestamps validatedAt y readyAt.
 */
export function buildTimingStats(orders: any[]): any[] {
  const map = new Map<string, { val: number[]; kit: number[]; tot: number[] }>();

  for (const order of orders) {
    if (!order.readyAt) continue;
    const cat = order.order_items?.[0]?.menu_items?.categories?.name ?? "Sin categoría";

    if (!map.has(cat)) map.set(cat, { val: [], kit: [], tot: [] });
    const g = map.get(cat)!;

    const valTime = diffMinutes(order.createdAt, order.validatedAt);
    const kitTime = diffMinutes(order.validatedAt, order.readyAt);
    const totTime = diffMinutes(order.createdAt, order.readyAt);

    if (valTime !== null && valTime >= 0) g.val.push(valTime);
    if (kitTime !== null && kitTime >= 0) g.kit.push(kitTime);
    if (totTime !== null && totTime >= 0) g.tot.push(totTime);
  }

  return Array.from(map.entries())
    .map(([category, g]) => ({
      category,
      validationMin: avgOrNull(g.val),
      kitchenMin:    avgOrNull(g.kit),
      totalMin:      avgOrNull(g.tot),
      count:         g.tot.length,
    }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.kitchenMin - a.kitchenMin);
}
