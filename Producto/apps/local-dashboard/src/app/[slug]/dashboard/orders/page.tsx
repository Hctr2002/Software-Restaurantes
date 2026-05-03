"use client";

import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@menu-bites/auth";
import LocalShell from "../_components/LocalShell";
import { Table, TableRow, TableCell, Modal, Badge, Button } from "@menu-bites/ui";
import { formatDate, formatPrice, timeAgo, Order, ORDER_STATUSES } from "../_components/localShared";
import { Loader2, RefreshCw, User, ShoppingBag, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    (sum, item) => sum + Number(item.unitPrice ?? 0) * (item.quantity ?? 1),
    0
  );
}

const NEXT_STATUS: Record<string, string> = {
  PENDING: "VALIDATED",
  VALIDATED: "PREPARING",
  PREPARING: "READY",
  READY: "DELIVERED",
};

function garzonLabel(order: Order): string {
  if (!order.users?.email) return "S/A";
  return order.users.email.split("@")[0];
}

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

    const channel = supabase
      .channel("local-dashboard-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold mb-6">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer sm:w-64"
        >
          <option value="ALL" className="bg-background">Todos los estados</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s} className="bg-background">{s}</option>
          ))}
        </select>

        <Button
          variant="ghost"
          onClick={fetchOrders}
          className="h-11 px-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/10 hover:text-primary transition-all group font-bold uppercase tracking-widest text-[10px]"
        >
          <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
          Actualizar Lista
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">Sincronizando comandas...</p>
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {filtered.length === 0 && (
              <div className="py-12 text-center glass rounded-[2.5rem] border-white/5">
                <p className="text-foreground/40 font-bold uppercase tracking-widest text-[10px]">No se encontraron pedidos.</p>
              </div>
            )}
            {filtered.map((order) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={order.id}
                className="glass p-6 rounded-[2rem] border-white/5 space-y-4 relative overflow-hidden"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h3 className="font-black text-foreground text-lg tracking-tight uppercase italic leading-none mb-1">Mesa {order.tables?.number ?? "S/N"}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-foreground/30 uppercase tracking-widest">
                      <User className="w-3 h-3" />
                      <span>{garzonLabel(order)}</span>
                      <span className="text-foreground/10">•</span>
                      <Clock className="w-3 h-3" />
                      <span>{timeAgo(order.createdAt)}</span>
                    </div>
                  </div>
                  <Badge variant={orderStatusVariant(order.status)} className="px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                    {order.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-black text-foreground/60 uppercase tracking-widest">{order.order_items?.length ?? 0} Items</span>
                  </div>
                  <span className="text-lg font-black text-primary">{formatPrice(orderTotal(order))}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block">
            <Table headers={["Mesa", "Garzón", "Estado", "Items", "Total", "Fecha", ""]}>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-foreground/40 py-12 font-bold uppercase tracking-widest text-xs">
                    No hay pedidos registrados.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-black text-foreground text-sm italic uppercase tracking-tight">
                    Mesa {order.tables?.number ?? "S/N"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-foreground/60 text-[11px] font-bold uppercase tracking-widest">
                      <User className="w-3.5 h-3.5 text-primary/40" />
                      {garzonLabel(order)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={orderStatusVariant(order.status)} className="px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground/40 text-[11px] font-bold">
                    {order.order_items?.length ?? 0} item(s)
                  </TableCell>
                  <TableCell className="font-black text-primary text-sm">
                    {formatPrice(orderTotal(order))}
                  </TableCell>
                  <TableCell className="text-foreground/30 text-[10px] font-bold uppercase tracking-widest">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedOrder(order)}
                      className="text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/10 rounded-xl"
                    >
                      Ver detalle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        </>
      )}

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Detalle — Mesa ${selectedOrder?.tables?.number ?? "S/N"}`}
        footer={
          selectedOrder && NEXT_STATUS[selectedOrder.status] ? (
            <>
              <Button variant="ghost" onClick={() => setSelectedOrder(null)} className="text-foreground/50 hover:bg-white/5 hover:text-foreground rounded-xl font-bold uppercase tracking-widest text-[10px]">Cerrar</Button>
              <Button
                onClick={() => handleStatusChange(selectedOrder.id, NEXT_STATUS[selectedOrder.status])}
                disabled={updatingStatus}
                className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-primary/20 transition-all"
              >
                {updatingStatus
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : `Avanzar a ${NEXT_STATUS[selectedOrder.status]}`}
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setSelectedOrder(null)} className="text-foreground/50 hover:bg-white/5 hover:text-foreground rounded-xl font-bold uppercase tracking-widest text-[10px]">Cerrar</Button>
          )
        }
      >
        {selectedOrder && (
          <div className="space-y-8 py-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <Badge variant={orderStatusVariant(selectedOrder.status)} className="px-4 py-1 text-[10px] font-black uppercase tracking-widest">{selectedOrder.status}</Badge>
              <div className="flex items-center gap-2 text-[10px] font-bold text-foreground/30 uppercase tracking-widest">
                <Clock className="w-3.5 h-3.5" />
                {timeAgo(selectedOrder.createdAt)}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">Items de la Orden</p>
              <div className="space-y-2">
                {(selectedOrder.order_items ?? []).map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs italic">
                        {item.quantity ?? 1}x
                      </div>
                      <span className="text-sm font-bold text-foreground uppercase italic tracking-tight">{item.menu_items?.name ?? "Item"}</span>
                    </div>
                    <span className="text-sm font-black text-foreground/60">
                      {formatPrice(Number(item.unitPrice ?? 0) * (item.quantity ?? 1))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-[2rem] bg-primary/10 border border-primary/20 flex justify-between items-center shadow-xl shadow-primary/5">
              <span className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Total del Pedido</span>
              <span className="text-3xl font-black text-primary italic leading-none">{formatPrice(orderTotal(selectedOrder))}</span>
            </div>

            <div className="text-center">
               <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">Registrado el {formatDate(selectedOrder.createdAt)}</p>
            </div>
          </div>
        )}
      </Modal>
    </LocalShell>
  );
}
