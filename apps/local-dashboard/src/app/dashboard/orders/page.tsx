"use client";

import React, { useCallback, useEffect, useState } from "react";
import LocalShell from "../_components/LocalShell";
import { Table, TableRow, TableCell } from "../_components/Table";
import Modal from "../_components/Modal";
import { Badge } from "../_components/Badge";
import { formatDate, formatPrice, Order, ORDER_STATUSES } from "../_components/localShared";
import { Button } from "@menu-bites/ui";
import { Loader2, RefreshCw } from "lucide-react";

type BadgeVariant = "success" | "danger" | "warning" | "neutral" | "info";

function orderStatusVariant(status: string): BadgeVariant {
  if (status === "PENDING") return "warning";
  if (status === "PREPARING") return "info";
  if (status === "READY") return "success";
  if (status === "DELIVERED") return "neutral";
  return "neutral";
}

function orderTotal(order: Order): number {
  return (order.order_items ?? []).reduce(
    (sum, item) => sum + Number(item.unit_price ?? 0),
    0
  );
}

function timeAgo(value: string): string {
  const diff = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (diff < 1) return "Hace un momento";
  if (diff === 1) return "Hace 1 min";
  if (diff < 60) return `Hace ${diff} min`;
  const hrs = Math.floor(diff / 60);
  return `Hace ${hrs}h ${diff % 60}min`;
}

const NEXT_STATUS: Record<string, string> = {
  PENDING: "VALIDATED",
  VALIDATED: "PREPARING",
  PREPARING: "READY",
  READY: "DELIVERED",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = useCallback(async () => {
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

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/local/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error actualizando estado");
      await fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filtered = filterStatus === "ALL"
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  return (
    <LocalShell title="Gestión" subtitle="Pedidos">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="ALL">Todos los estados</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando pedidos...</p>
      ) : (
        <Table headers={["Mesa", "Estado", "Items", "Total", "Fecha", ""]}>
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No hay pedidos registrados.
              </TableCell>
            </TableRow>
          )}
          {filtered.map((order) => (
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
              <TableCell className="font-mono text-slate-300">
                {formatPrice(orderTotal(order))}
              </TableCell>
              <TableCell className="text-slate-400 text-xs">
                {formatDate(order.createdAt)}
              </TableCell>
              <TableCell>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Ver detalle
                </button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Pedido — Mesa ${selectedOrder?.tables?.number ?? "S/N"}`}
        footer={
          selectedOrder && NEXT_STATUS[selectedOrder.status] ? (
            <>
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>Cerrar</Button>
              <Button
                onClick={() => handleStatusChange(selectedOrder.id, NEXT_STATUS[selectedOrder.status])}
                disabled={updatingStatus}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {updatingStatus
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : `Avanzar a ${NEXT_STATUS[selectedOrder.status]}`}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>Cerrar</Button>
          )
        }
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Status + time */}
            <div className="flex items-center justify-between">
              <Badge variant={orderStatusVariant(selectedOrder.status)}>{selectedOrder.status}</Badge>
              <span className="text-xs text-slate-500">{timeAgo(selectedOrder.createdAt)}</span>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detalle del pedido</p>
              {(selectedOrder.order_items ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">Sin items registrados.</p>
              ) : (
                <div className="space-y-2">
                  {(selectedOrder.order_items ?? []).map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-800/50">
                      <span className="text-sm text-slate-300">{item.menu_items?.name ?? "Item"}</span>
                      <span className="text-sm font-mono text-slate-400">
                        {formatPrice(Number(item.unit_price ?? 0))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Total</span>
              <span className="text-xl font-black text-slate-100">{formatPrice(orderTotal(selectedOrder))}</span>
            </div>

            <p className="text-[11px] text-slate-500">{formatDate(selectedOrder.createdAt)}</p>
          </div>
        )}
      </Modal>
    </LocalShell>
  );
}
