"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@menu-bites/ui";
import { UtensilsCrossed, TableProperties, ClipboardList } from "lucide-react";
import LocalShell from "./_components/LocalShell";
import { formatDate, formatPrice, MenuItem, Order, TableRecord } from "./_components/localShared";
import { Badge } from "./_components/Badge";

function statusBadgeVariant(status: string) {
  if (status === "PENDING") return "warning";
  if (status === "PREPARING") return "info";
  if (status === "READY") return "success";
  if (status === "DELIVERED") return "neutral";
  return "neutral";
}

export default function DashboardPage() {
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [tables, setTables] = React.useState<TableRecord[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [menuRes, tablesRes, ordersRes] = await Promise.all([
        fetch("/api/local/menu", { cache: "no-store" }),
        fetch("/api/local/tables", { cache: "no-store" }),
        fetch("/api/local/orders", { cache: "no-store" }),
      ]);

      const menuJson = await menuRes.json();
      const tablesJson = await tablesRes.json();
      const ordersJson = await ordersRes.json();

      if (!menuRes.ok) throw new Error(menuJson.error || "Error cargando menú");
      if (!tablesRes.ok) throw new Error(tablesJson.error || "Error cargando mesas");
      if (!ordersRes.ok) throw new Error(ordersJson.error || "Error cargando pedidos");

      setMenuItems(menuJson.data || []);
      setTables(tablesJson.data || []);
      setOrders(ordersJson.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const today = new Date().toDateString();
  const ordersToday = orders.filter((o) => new Date(o.created_at).toDateString() === today);
  const activeItems = menuItems.filter((m) => m.is_active).length;
  const occupiedTables = tables.filter((t) => t.status === "OCCUPIED").length;
  const pendingOrders = orders.filter((o) => o.status === "PENDING" || o.status === "PREPARING").length;

  return (
    <LocalShell title="Panel Local" subtitle="Resumen">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Items del Menú" value={menuItems.length} detail={`${activeItems} activos`} />
        <KpiCard label="Mesas Totales" value={tables.length} detail={`${occupiedTables} ocupadas`} />
        <KpiCard label="Pedidos Hoy" value={ordersToday.length} detail={`${pendingOrders} en curso`} />
        <KpiCard label="Pedidos Activos" value={pendingOrders} detail="Pendiente o en preparación" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card className="border-white/5 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" /> Últimos 10 Pedidos
            </CardTitle>
            <CardDescription>Pedidos más recientes del restaurante</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">No hay pedidos registrados.</p>
            )}
            {orders.slice(0, 10).map((order) => (
              <div key={order.id} className="p-3 rounded-xl border border-white/10 bg-black/20 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">
                    Mesa {order.tables?.number ?? "S/N"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">{formatDate(order.created_at)}</p>
                </div>
                <Badge variant={statusBadgeVariant(order.status)}>{order.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TableProperties className="w-5 h-5" /> Estado de Mesas
            </CardTitle>
            <CardDescription>Distribución actual del salón</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tables.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">No hay mesas registradas.</p>
            )}
            {tables.map((table) => (
              <div key={table.id} className="p-3 rounded-xl border border-white/10 bg-black/20 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Mesa {table.number}</p>
                  {table.label && <p className="text-xs text-muted-foreground">{table.label}</p>}
                </div>
                <Badge variant={table.status === "AVAILABLE" ? "success" : table.status === "OCCUPIED" ? "danger" : "warning"}>
                  {table.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando datos del local...</p>}
    </LocalShell>
  );
}

function KpiCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <Card className="border-white/5 bg-white/5 backdrop-blur-md">
      <CardContent className="pt-6">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</p>
        <p className="text-3xl font-black tracking-tight mt-1">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{detail}</p>
      </CardContent>
    </Card>
  );
}
