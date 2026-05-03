"use client";

import { useCallback, useEffect, useState } from "react";
import LocalShell from "../_components/LocalShell";
import { Table, TableRow, TableCell } from "@menu-bites/ui";
import { formatPrice } from "../_components/localShared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@menu-bites/ui";
import { TrendingUp, UtensilsCrossed, TableProperties, Award, Download, Calendar, Filter } from "lucide-react";
import { Button } from "@menu-bites/ui";
import { motion } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────
type DayReport    = { date: string; orders: number; revenue: number; avg: number };
type TopItem      = { name: string; count: number; revenue: number };
type TableReport  = { number: number; orders: number; revenue: number };
type GarzonReport = { email: string; orders: number; revenue: number };

// ─── Period presets ───────────────────────────────────────────────────────────
const PRESETS = [
  { label: "7D",   days: 7 },
  { label: "14D",  days: 14 },
  { label: "30D",  days: 30 },
  { label: "90D",  days: 90 },
  { label: "CUSTOM", days: 0 },
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
  return "text-foreground/40";
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
    <LocalShell title="Analítica" subtitle="Reportes de Venta">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold mb-6">
          {error}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="glass p-6 rounded-[2.5rem] border-white/5 mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
            <Filter className="w-3 h-3" /> Filtrar Período
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.days}
                onClick={() => applyPreset(p.days)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  (p.days === 0 ? isCustom : !isCustom && preset === p.days)
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-white/5 text-foreground/40 hover:bg-white/10 hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {isCustom && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-wrap items-end gap-3 glass p-4 rounded-2xl border-white/5">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-foreground/30 uppercase tracking-widest px-1">Desde</label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || todayISO()}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-foreground/30 uppercase tracking-widest px-1">Hasta</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                max={todayISO()}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <Button
              onClick={applyCustomRange}
              disabled={!dateFrom || !dateTo || dateFrom > dateTo}
              className="bg-primary hover:bg-primary/80 text-primary-foreground h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              Aplicar
            </Button>
          </motion.div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleExport}
            disabled={loading}
            variant="ghost"
            className="h-11 px-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/10 hover:text-primary transition-all group font-bold uppercase tracking-widest text-[10px]"
          >
            <Download className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
            Descargar Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">Calculando métricas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {/* Ventas por día */}
          <Card className="glass rounded-[2.5rem] border-white/5 overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                   <CardTitle className="text-lg font-black text-foreground uppercase italic tracking-tight">Rendimiento Diario</CardTitle>
                   <CardDescription className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">{periodDescription}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table headers={["Fecha", "Pedidos", "Ingresos", "Avg"]}>
                {dailyReports.every((r) => r.orders === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-foreground/40 py-12 font-bold uppercase tracking-widest text-xs">Sin ventas en este período.</TableCell>
                  </TableRow>
                )}
                {dailyReports.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell className={`font-black text-[11px] uppercase tracking-tight italic ${row.orders === 0 ? "text-foreground/20" : "text-foreground"}`}>
                      {formatShortDate(row.date)}
                    </TableCell>
                    <TableCell className="text-foreground/40 font-bold text-xs" style={{ fontFamily: 'var(--font-accent)' }}>{row.orders || "—"}</TableCell>
                    <TableCell className={`font-black text-sm italic ${row.orders > 0 ? 'text-primary' : 'text-foreground/20'}`} style={{ fontFamily: 'var(--font-accent)' }}>{row.orders ? formatPrice(row.revenue) : "—"}</TableCell>
                    <TableCell className="font-bold text-foreground/30 text-[11px]" style={{ fontFamily: 'var(--font-accent)' }}>{row.orders ? formatPrice(row.avg) : "—"}</TableCell>
                  </TableRow>
                ))}
              </Table>
            </CardContent>
          </Card>

          {/* Ranking garzones */}
          <Card className="glass rounded-[2.5rem] border-white/5 overflow-hidden">
            <CardHeader className="p-8 pb-4">
               <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                   <CardTitle className="text-lg font-black text-foreground uppercase italic tracking-tight">Ranking de Equipo</CardTitle>
                   <CardDescription className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Top rendimiento por garzón</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table headers={["#", "Garzón", "Pedidos", "Ingresos"]}>
                {garzonReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-foreground/40 py-12 font-bold uppercase tracking-widest text-xs">
                      Sin datos registrados.
                    </TableCell>
                  </TableRow>
                )}
                {garzonReports.map((row, i) => (
                  <TableRow key={row.email}>
                    <TableCell>
                      <span className={`text-sm font-black italic ${medalColor(i)}`}>#{i + 1}</span>
                    </TableCell>
                    <TableCell className="font-black text-foreground text-xs uppercase italic tracking-tight">
                      {row.email.split("@")[0]}
                    </TableCell>
                    <TableCell className="text-foreground/40 font-bold text-xs" style={{ fontFamily: 'var(--font-accent)' }}>{row.orders}</TableCell>
                    <TableCell className="font-black text-emerald-500 text-sm italic" style={{ fontFamily: 'var(--font-accent)' }}>{formatPrice(row.revenue)}</TableCell>
                  </TableRow>
                ))}
              </Table>
            </CardContent>
          </Card>

          {/* Top items */}
          <Card className="glass rounded-[2.5rem] border-white/5 overflow-hidden">
            <CardHeader className="p-8 pb-4">
               <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                   <CardTitle className="text-lg font-black text-foreground uppercase italic tracking-tight">Favoritos del Público</CardTitle>
                   <CardDescription className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Los 10 más pedidos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table headers={["Plato", "Ventas", "Ingresos"]}>
                {topItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-foreground/40 py-12 font-bold uppercase tracking-widest text-xs">Sin platos vendidos.</TableCell>
                  </TableRow>
                )}
                {topItems.map((item, i) => (
                  <TableRow key={item.name}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-foreground/20 italic w-4">#{i + 1}</span>
                        <span className="font-black text-foreground text-xs uppercase italic tracking-tight">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><span className="font-black text-amber-500 text-sm italic">{item.count}x</span></TableCell>
                    <TableCell className="font-bold text-foreground/40 text-xs">{formatPrice(item.revenue)}</TableCell>
                  </TableRow>
                ))}
              </Table>
            </CardContent>
          </Card>

          {/* Ingresos por mesa */}
          <Card className="glass rounded-[2.5rem] border-white/5 overflow-hidden">
            <CardHeader className="p-8 pb-4">
               <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <TableProperties className="w-5 h-5" />
                </div>
                <div>
                   <CardTitle className="text-lg font-black text-foreground uppercase italic tracking-tight">Ocupación por Mesa</CardTitle>
                   <CardDescription className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Rendimiento por zona</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table headers={["Mesa", "Pedidos", "Total"]}>
                {tableReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-foreground/40 py-12 font-bold uppercase tracking-widest text-xs">Sin datos de mesas.</TableCell>
                  </TableRow>
                )}
                {tableReports.map((row) => (
                  <TableRow key={row.number}>
                    <TableCell className="font-black text-foreground text-sm uppercase italic tracking-tight">Mesa {row.number}</TableCell>
                    <TableCell className="text-foreground/40 font-bold text-xs">{row.orders}</TableCell>
                    <TableCell className="font-black text-primary text-sm italic">{formatPrice(row.revenue)}</TableCell>
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
