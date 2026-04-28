"use client";

import React, { useCallback, useEffect, useState } from "react";
import LocalShell from "../_components/LocalShell";
import { Table, TableRow, TableCell } from "../_components/Table";
import { formatPrice } from "../_components/localShared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@menu-bites/ui";
import { TrendingUp, UtensilsCrossed, TableProperties } from "lucide-react";

type DayReport = { date: string; orders: number; revenue: number; avg: number };
type TopItem = { name: string; category: string; count: number; revenue: number };
type TableReport = { number: number; orders: number; revenue: number };

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export default function ReportsPage() {
  const [dailyReports, setDailyReports] = useState<DayReport[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [tableReports, setTableReports] = useState<TableReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch delivered orders for the last 7 days with full detail
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const res = await fetch(
        `/api/local/orders?from=${sevenDaysAgo.toISOString()}&status=DELIVERED`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error cargando reportes");

      const orders: any[] = (json.data || []).filter((o: any) => o.status === "DELIVERED");

      // Build daily reports (last 7 days)
      const dayMap: Record<string, { orders: number; revenue: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dayMap[key] = { orders: 0, revenue: 0 };
      }

      orders.forEach((order: any) => {
        const key = order.created_at.slice(0, 10);
        if (!dayMap[key]) return;
        const total = (order.order_items ?? []).reduce(
          (s: number, item: any) => s + (item.menu_items?.price ?? 0), 0
        );
        dayMap[key].orders++;
        dayMap[key].revenue += total;
      });

      const daily: DayReport[] = Object.entries(dayMap).map(([date, v]) => ({
        date,
        orders: v.orders,
        revenue: v.revenue,
        avg: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0,
      }));
      setDailyReports(daily);

      // Top items
      const itemMap: Record<string, { name: string; category: string; count: number; revenue: number }> = {};
      orders.forEach((order: any) => {
        (order.order_items ?? []).forEach((item: any) => {
          const name = item.menu_items?.name;
          if (!name) return;
          if (!itemMap[name]) itemMap[name] = { name, category: "—", count: 0, revenue: 0 };
          itemMap[name].count++;
          itemMap[name].revenue += item.menu_items?.price ?? 0;
        });
      });
      setTopItems(Object.values(itemMap).sort((a, b) => b.count - a.count).slice(0, 10));

      // Table reports
      const tblMap: Record<number, { orders: number; revenue: number }> = {};
      orders.forEach((order: any) => {
        const num = order.tables?.number;
        if (!num) return;
        if (!tblMap[num]) tblMap[num] = { orders: 0, revenue: 0 };
        const total = (order.order_items ?? []).reduce(
          (s: number, item: any) => s + (item.menu_items?.price ?? 0), 0
        );
        tblMap[num].orders++;
        tblMap[num].revenue += total;
      });
      setTableReports(
        Object.entries(tblMap)
          .map(([number, v]) => ({ number: Number(number), ...v }))
          .sort((a, b) => b.revenue - a.revenue)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  return (
    <LocalShell title="Reportes" subtitle="Análisis de Ventas">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando reportes...</p>
      ) : (
        <div className="space-y-8">
          {/* Ventas últimos 7 días */}
          <Card className="border-white/5 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Ventas últimos 7 días
              </CardTitle>
              <CardDescription>Pedidos entregados por día</CardDescription>
            </CardHeader>
            <CardContent>
              <Table headers={["Fecha", "Pedidos", "Ingresos", "Ticket Promedio"]}>
                {dailyReports.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell className="font-medium text-slate-200">{formatShortDate(row.date)}</TableCell>
                    <TableCell className="text-slate-400">{row.orders}</TableCell>
                    <TableCell className="font-mono text-slate-300">{formatPrice(row.revenue)}</TableCell>
                    <TableCell className="font-mono text-slate-400">{formatPrice(row.avg)}</TableCell>
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
              <CardDescription>Últimos 7 días</CardDescription>
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
                    <TableCell>
                      <span className="font-bold text-primary">{item.count}x</span>
                    </TableCell>
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
              <CardDescription>Últimos 7 días, ordenado por ingresos</CardDescription>
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
