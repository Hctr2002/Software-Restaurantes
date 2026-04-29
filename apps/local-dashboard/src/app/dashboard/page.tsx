"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@menu-bites/ui";
import { TrendingUp, Wallet, ReceiptText, ClipboardList, UtensilsCrossed } from "lucide-react";
import LocalShell from "./_components/LocalShell";
import { formatPrice, formatDate, Order, StatsData, TableRecord } from "./_components/localShared";
import { Badge } from "./_components/Badge";
import { cn } from "@menu-bites/ui/lib/utils";

function tableStatusVariant(status: string) {
  if (status === "AVAILABLE") return "success";
  if (status === "OCCUPIED") return "danger";
  if (status === "RESERVED") return "warning";
  return "neutral";
}

function orderStatusVariant(status: string) {
  if (status === "PENDING") return "warning";
  if (status === "PREPARING") return "info";
  if (status === "READY") return "success";
  if (status === "DELIVERED") return "neutral";
  return "neutral";
}

export default function DashboardPage() {
  const [stats, setStats] = React.useState<StatsData | null>(null);
  const [pedidosDia, setPedidosDia] = React.useState(0);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [tables, setTables] = React.useState<TableRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setError(null);
    try {
      const [statsRes, ordersRes, tablesRes] = await Promise.all([
        fetch("/api/local/stats", { cache: "no-store" }),
        fetch("/api/local/orders", { cache: "no-store" }),
        fetch("/api/local/tables", { cache: "no-store" }),
      ]);

      const statsJson = await statsRes.json();
      const ordersJson = await ordersRes.json();
      const tablesJson = await tablesRes.json();

      // Stats se trata como no-crítico: si falla muestra ceros, no bloquea el dashboard
      if (statsRes.ok) {
        setStats(statsJson.data || null);
        setPedidosDia(statsJson.data?.pedidos_dia ?? 0);
      }
      if (!ordersRes.ok) throw new Error(ordersJson.error || "Error cargando pedidos");
      if (!tablesRes.ok) throw new Error(tablesJson.error || "Error cargando mesas");

      setOrders(ordersJson.data || []);
      setTables(tablesJson.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const pendingOrders = orders.filter((o) => o.status === "PENDING" || o.status === "PREPARING");

  return (
    <LocalShell title="Panel Local" subtitle="Resumen">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold">
          {error}
        </div>
      )}

      {/* KPIs financieros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={<Wallet className="w-5 h-5 text-emerald-400" />}
          label="Ingresos del Día"
          value={formatPrice(stats?.ingresos_dia ?? 0)}
          detail={`${pedidosDia} pedido${pedidosDia !== 1 ? "s" : ""} entregado${pedidosDia !== 1 ? "s" : ""}`}
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
          label="Ingresos del Mes"
          value={formatPrice(stats?.ingresos_mes ?? 0)}
          detail="Pedidos entregados este mes"
        />
        <KpiCard
          icon={<ReceiptText className="w-5 h-5 text-amber-400" />}
          label="Ticket Promedio"
          value={formatPrice(stats?.ticket_promedio ?? 0)}
          detail="Por pedido entregado hoy"
        />
        <KpiCard
          icon={<ClipboardList className="w-5 h-5 text-rose-400" />}
          label="Pedidos Activos"
          value={String(pendingOrders.length)}
          detail="Pendiente o en preparación"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top items */}
        <Card className="border-white/5 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UtensilsCrossed className="w-4 h-4" /> Top items hoy
            </CardTitle>
            <CardDescription>Los más pedidos del día</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!stats?.top_items?.length ? (
              <p className="text-sm text-muted-foreground">Sin pedidos entregados hoy.</p>
            ) : (
              stats.top_items.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-black/20">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-500 w-5">#{i + 1}</span>
                    <span className="text-sm font-medium text-slate-200">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {item.count}x
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Últimos pedidos */}
        <Card className="border-white/5 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="w-4 h-4" /> Últimos pedidos
            </CardTitle>
            <CardDescription>Los 8 más recientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {orders.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">No hay pedidos registrados.</p>
            )}
            {orders.slice(0, 8).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-2.5 rounded-lg border border-white/10 bg-black/20">
                <div>
                  <p className="text-sm font-bold text-slate-200">Mesa {order.tables?.number ?? "S/N"}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
                <Badge variant={orderStatusVariant(order.status)}>{order.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Grilla visual de mesas */}
        <Card className="border-white/5 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base">Estado de Mesas</CardTitle>
            <CardDescription>Distribución actual del salón</CardDescription>
          </CardHeader>
          <CardContent>
            {tables.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground">No hay mesas registradas.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border text-center",
                      table.status === "AVAILABLE" && "bg-emerald-500/10 border-emerald-500/20",
                      table.status === "OCCUPIED" && "bg-red-500/10 border-red-500/20",
                      table.status === "RESERVED" && "bg-amber-500/10 border-amber-500/20",
                      !["AVAILABLE", "OCCUPIED", "RESERVED"].includes(table.status) && "bg-slate-800/40 border-slate-700"
                    )}
                  >
                    <p className={cn(
                      "text-lg font-black",
                      table.status === "AVAILABLE" && "text-emerald-400",
                      table.status === "OCCUPIED" && "text-red-400",
                      table.status === "RESERVED" && "text-amber-400",
                    )}>
                      {table.number}
                    </p>
                    {table.label && (
                      <p className="text-[9px] text-slate-500 truncate w-full text-center">{table.label}</p>
                    )}
                    <span className={cn(
                      "text-[9px] font-bold uppercase mt-1",
                      table.status === "AVAILABLE" && "text-emerald-500",
                      table.status === "OCCUPIED" && "text-red-500",
                      table.status === "RESERVED" && "text-amber-500",
                    )}>
                      {table.status === "AVAILABLE" ? "Libre" : table.status === "OCCUPIED" ? "Ocupada" : "Reservada"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando datos del local...</p>}
    </LocalShell>
  );
}

function KpiCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <Card className="border-white/5 bg-white/5 backdrop-blur-md">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-2">{icon}<p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</p></div>
        <p className="text-2xl font-black tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{detail}</p>
      </CardContent>
    </Card>
  );
}
