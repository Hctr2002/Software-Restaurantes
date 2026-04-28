"use client";

import React, { useCallback, useEffect, useState } from "react";
import LocalShell from "../_components/LocalShell";
import { Table, TableRow, TableCell } from "../_components/Table";
import { Badge } from "../_components/Badge";
import { formatDate, Order } from "../_components/localShared";

function orderStatusVariant(status: string) {
  if (status === "PENDING") return "warning";
  if (status === "PREPARING") return "info";
  if (status === "READY") return "success";
  if (status === "DELIVERED") return "neutral";
  return "neutral";
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/local/orders", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error cargando pedidos");
      setOrders(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <LocalShell title="Gestión" subtitle="Pedidos">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando pedidos...</p>
      ) : (
        <Table headers={["Mesa", "Estado", "Items", "Fecha"]}>
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No hay pedidos registrados.
              </TableCell>
            </TableRow>
          )}
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-bold text-slate-200">
                Mesa {order.tables?.number ?? "S/N"}
              </TableCell>
              <TableCell>
                <Badge variant={orderStatusVariant(order.status)}>{order.status}</Badge>
              </TableCell>
              <TableCell className="text-slate-400">
                {order.order_items?.length ?? 0} item(s)
              </TableCell>
              <TableCell className="text-slate-400 text-xs">
                {formatDate(order.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}
    </LocalShell>
  );
}
