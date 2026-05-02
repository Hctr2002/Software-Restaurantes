"use client";

import { useCallback, useEffect, useState } from "react";
import LocalShell from "../_components/LocalShell";
import { Table, TableRow, TableCell } from "@menu-bites/ui";
import { formatPrice } from "../_components/localShared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@menu-bites/ui";
import { TrendingUp, UtensilsCrossed, TableProperties, Award, Download, Calendar } from "lucide-react";
import { Button } from "@menu-bites/ui";

// ─── Types ───────────────────────────────────────────────────────────────────
type DayReport    = { date: string; orders: number; revenue: number; avg: number };
type TopItem      = { name: string; count: number; revenue: number };
type TableReport  = { number: number; orders: number; revenue: number };
type GarzonReport = { email: string; orders: number; revenue: number };

// ─── Period presets ───────────────────────────────────────────────────────────
const PRESETS = [
  { label: "7 días",   days: 7 },
  { label: "14 días",  days: 14 },
  { label: "30 días",  days: 30 },
  { label: "90 días",  days: 90 },
  { label: "Personalizado", days: 0 },
] as const;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  return d.toISOString().slice(0, 10);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatShortDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-CL", {
    weekday: "short", day: "2-digit", month: "2-digit",
  });
}

function medalColor(i: number) {
  if (i === 0) return "text-yellow-400";
  if (i === 1) return "text-slate-300";
  if (i === 2) return "text-amber-600";
  return "text-slate-600";
}

function orderItemTotal(it: any): number {
  return Number(it.unitPrice ?? 0) * (it.quantity ?? 1);
}

// ─── XML export ───────────────────────────────────────────────────────────────
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

function buildSpreadsheetML(
  periodLabel: string,
  daily: DayReport[],
  garzones: GarzonReport[],
  items: TopItem[],
  tables: TableReport[],
): string {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#1E3A5F" ss:Pattern="Solid"/>
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

function downloadXML(content: string, filename: string) {
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [preset,   setPreset]   = useState<number>(7);
  const [dateFrom, setDateFrom] = useState(daysAgoISO(7));
  const [dateTo,   setDateTo]   = useState(todayISO());
  const [isCustom, setIsCustom] = useState(false);

  const [dailyReports,  setDailyReports]  = useState<DayReport[]>([]);
  const [topItems,      setTopItems]      = useState<TopItem[]>([]);
  const [tableReports,  setTableReports]  = useState<TableReport[]>([]);
  const [garzonReports, setGarzonReports] = useState<GarzonReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchReports = useCallback(async (from: string, to: string, days: number) => {
    setLoading(true);
    setError(null);
    try {
      const fromISO = new Date(from + "T00:00:00").toISOString();
      const toISO   = new Date(to   + "T23:59:59").toISOString();

      const res = await fetch(
        `/api/local/orders?from=${fromISO}&to=${toISO}&status=DELIVERED&limit=2000`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error cargando reportes");

      const orders: any[] = (json.data || []).filter((o: any) => o.status === "DELIVERED");

      // Ventas diarias — construir mapa dinámico según rango
      const dayMap: Record<string, { orders: number; revenue: number }> = {};
      const cursor = new Date(from + "T12:00:00");
      const toDate = new Date(to   + "T12:00:00");
      while (cursor <= toDate) {
        dayMap[cursor.toISOString().slice(0, 10)] = { orders: 0, revenue: 0 };
        cursor.setDate(cursor.getDate() + 1);
      }
      orders.forEach((order: any) => {
        const key = order.createdAt.slice(0, 10);
        if (!dayMap[key]) return;
        const total = (order.order_items ?? []).reduce((s: number, it: any) => s + orderItemTotal(it), 0);
        dayMap[key].orders++;
        dayMap[key].revenue += total;
      });
      setDailyReports(
        Object.entries(dayMap).map(([date, v]) => ({
          date,
          orders: v.orders,
          revenue: v.revenue,
          avg: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0,
        }))
      );

      // Top items
      const itemMap: Record<string, { count: number; revenue: number }> = {};
      orders.forEach((order: any) => {
        (order.order_items ?? []).forEach((it: any) => {
          const name = it.menu_items?.name;
          if (!name) return;
          if (!itemMap[name]) itemMap[name] = { count: 0, revenue: 0 };
          itemMap[name].count++;
          itemMap[name].revenue += orderItemTotal(it);
        });
      });
      setTopItems(
        Object.entries(itemMap)
          .map(([name, v]) => ({ name, ...v }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      );

      // Ingresos por mesa
      const tblMap: Record<number, { orders: number; revenue: number }> = {};
      orders.forEach((order: any) => {
        const num = order.tables?.number;
        if (!num) return;
        if (!tblMap[num]) tblMap[num] = { orders: 0, revenue: 0 };
        const total = (order.order_items ?? []).reduce((s: number, it: any) => s + orderItemTotal(it), 0);
        tblMap[num].orders++;
        tblMap[num].revenue += total;
      });
      setTableReports(
        Object.entries(tblMap)
          .map(([number, v]) => ({ number: Number(number), ...v }))
          .sort((a, b) => b.revenue - a.revenue)
      );

      // Ranking garzones
      const garzonMap: Record<string, { orders: number; revenue: number }> = {};
      orders.forEach((order: any) => {
        const email = order.users?.email;
        if (!email) return;
        if (!garzonMap[email]) garzonMap[email] = { orders: 0, revenue: 0 };
        const total = (order.order_items ?? []).reduce((s: number, it: any) => s + orderItemTotal(it), 0);
        garzonMap[email].orders++;
        garzonMap[email].revenue += total;
      });
      setGarzonReports(
        Object.entries(garzonMap)
          .map(([email, v]) => ({ email, ...v }))
          .sort((a, b) => b.revenue - a.revenue)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger on preset/custom range apply
  useEffect(() => {
    if (!isCustom) fetchReports(dateFrom, dateTo, preset);
  }, [preset, isCustom]); // eslint-disable-line react-hooks/exhaustive-deps

  function applyPreset(days: number) {
    if (days === 0) {
      setIsCustom(true);
      return;
    }
    setIsCustom(false);
    setPreset(days);
    const from = daysAgoISO(days);
    const to   = todayISO();
    setDateFrom(from);
    setDateTo(to);
    fetchReports(from, to, days);
  }

  function applyCustomRange() {
    if (!dateFrom || !dateTo || dateFrom > dateTo) return;
    fetchReports(dateFrom, dateTo, 0);
  }

  function handleExport() {
    const periodLabel = isCustom
      ? `${dateFrom}_al_${dateTo}`
      : `ultimos_${preset}_dias`;

    const xml = buildSpreadsheetML(
      periodLabel,
      dailyReports,
      garzonReports,
      topItems,
      tableReports,
    );
    downloadXML(xml, `reporte_ventas_${periodLabel}.xls`);
  }

  const periodDescription = isCustom
    ? `${dateFrom} al ${dateTo}`
    : `Últimos ${preset} días`;

  return (
    <LocalShell title="Reportes" subtitle="Análisis de Ventas">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold">
          {error}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-end gap-3 mb-6 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Período
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.days}
                onClick={() => applyPreset(p.days)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  (p.days === 0 ? isCustom : !isCustom && preset === p.days)
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {isCustom && (
          <div className="flex items-end gap-2 flex-wrap">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Desde</label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || todayISO()}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Hasta</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                max={todayISO()}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <Button
              onClick={applyCustomRange}
              disabled={!dateFrom || !dateTo || dateFrom > dateTo}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-[34px]"
            >
              Aplicar
            </Button>
          </div>
        )}

        <div className="ml-auto">
          <Button
            onClick={handleExport}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2 text-xs border-slate-700 text-slate-300 hover:text-white hover:border-slate-500"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar XML
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando reportes...</p>
      ) : (
        <div className="space-y-8">

          {/* Ventas por día */}
          <Card className="border-white/5 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Ventas por día
              </CardTitle>
              <CardDescription>{periodDescription} — pedidos entregados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table headers={["Fecha", "Pedidos", "Ingresos", "Ticket Promedio"]}>
                {dailyReports.every((r) => r.orders === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">Sin ventas en este período.</TableCell>
                  </TableRow>
                )}
                {dailyReports.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell className={`font-medium ${row.orders === 0 ? "text-slate-600" : "text-slate-200"}`}>
                      {formatShortDate(row.date)}
                    </TableCell>
                    <TableCell className="text-slate-400">{row.orders || "—"}</TableCell>
                    <TableCell className="font-mono text-slate-300">{row.orders ? formatPrice(row.revenue) : "—"}</TableCell>
                    <TableCell className="font-mono text-slate-400">{row.orders ? formatPrice(row.avg) : "—"}</TableCell>
                  </TableRow>
                ))}
              </Table>
            </CardContent>
          </Card>

          {/* Ranking garzones */}
          <Card className="border-white/5 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" /> Ranking de garzones
              </CardTitle>
              <CardDescription>{periodDescription} — ordenado por ingresos generados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table headers={["#", "Garzón", "Pedidos atendidos", "Ingresos generados"]}>
                {garzonReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      Sin datos. Los pedidos deben tener un garzón asignado.
                    </TableCell>
                  </TableRow>
                )}
                {garzonReports.map((row, i) => (
                  <TableRow key={row.email}>
                    <TableCell>
                      <span className={`text-sm font-black ${medalColor(i)}`}>#{i + 1}</span>
                    </TableCell>
                    <TableCell className="font-medium text-slate-200">
                      {row.email.split("@")[0]}
                      <span className="text-xs text-slate-500 ml-1">@{row.email.split("@")[1]}</span>
                    </TableCell>
                    <TableCell className="text-slate-400">{row.orders}</TableCell>
                    <TableCell className="font-mono text-slate-300">{formatPrice(row.revenue)}</TableCell>
                  </TableRow>
                ))}
              </Table>
            </CardContent>
          </Card>

          {/* Top items */}
          <Card className="border-white/5 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5" /> Top 10 items más vendidos
              </CardTitle>
              <CardDescription>{periodDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table headers={["Item", "Veces pedido", "Ingresos generados"]}>
                {topItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">Sin datos.</TableCell>
                  </TableRow>
                )}
                {topItems.map((item, i) => (
                  <TableRow key={item.name}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-600 w-5">#{i + 1}</span>
                        <span className="font-medium text-slate-200">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><span className="font-bold text-primary">{item.count}x</span></TableCell>
                    <TableCell className="font-mono text-slate-300">{formatPrice(item.revenue)}</TableCell>
                  </TableRow>
                ))}
              </Table>
            </CardContent>
          </Card>

          {/* Ingresos por mesa */}
          <Card className="border-white/5 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TableProperties className="w-5 h-5" /> Ingresos por mesa
              </CardTitle>
              <CardDescription>{periodDescription} — ordenado por ingresos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table headers={["Mesa", "Pedidos", "Ingresos totales"]}>
                {tableReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">Sin datos.</TableCell>
                  </TableRow>
                )}
                {tableReports.map((row) => (
                  <TableRow key={row.number}>
                    <TableCell className="font-bold text-slate-200">Mesa {row.number}</TableCell>
                    <TableCell className="text-slate-400">{row.orders}</TableCell>
                    <TableCell className="font-mono text-slate-300">{formatPrice(row.revenue)}</TableCell>
                  </TableRow>
                ))}
              </Table>
            </CardContent>
          </Card>

        </div>
      )}
    </LocalShell>
  );
}
