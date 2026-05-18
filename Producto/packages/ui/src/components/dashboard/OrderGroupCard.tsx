"use client";

/**
 * OrderGroupCard — Tarjeta de pedido agrupado por mesa para el terminal del garzón.
 * Fusiona sub-órdenes KITCHEN y BAR en una vista unificada.
 * Expone acciones de validar, rechazar y entregar desde la interfaz del garzón.
 */

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, ChevronRight, Clock, Hash, Bell } from "lucide-react";
import { formatCLP, timeAgo } from "@menu-bites/auth";
import { Badge } from "../Badge";
import { Button } from "../ui/button";
import { Order, TableGroup } from "./dashboardTypes";

interface Props {
  group: TableGroup;
  index: number;
  isPending: boolean;
  onClick: () => void;
}

export function OrderGroupCard({ group, index, isPending, onClick }: Props) {
  const allItems    = group.orders.flatMap((o) => o.orderItems ?? []);
  const previewItems = allItems.slice(0, 4);
  const extraCount   = allItems.length - previewItems.length;
  const tableLabel   = group.sessionId ? "Mesas fusionadas" : `Mesa ${group.tableNumber ?? "S/N"}`;

  return (
    <motion.div
      key={group.key}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative bg-card border border-border rounded-[2.5rem] p-7 flex flex-col transition-all hover:border-primary/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] cursor-pointer ${
        !isPending ? "opacity-75" : ""
      } ${group.billRequested ? "ring-2 ring-warning/30 shadow-[0_0_20px_hsl(var(--warning)/0.1)]" : ""}`}
      onClick={onClick}
    >
      {group.billRequested && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -inset-0.5 bg-warning/20 rounded-[2.6rem] blur animate-pulse -z-10"
        />
      )}

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${
            group.billRequested
              ? "bg-warning/10 border-warning/30 text-warning"
              : "bg-muted border-border text-primary"
          }`}>
            <Hash className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-foreground tracking-tighter leading-none">{tableLabel}</h3>
            <p className="text-[10px] text-muted-foreground font-black tracking-widest uppercase mt-1.5 opacity-60">
              {group.orders.length} {group.orders.length > 1 ? "Comandas" : "Comanda"}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-lg border border-border">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
              {timeAgo(group.oldestCreatedAt)}
            </span>
          </div>
          <Badge variant={isPending ? "success" : "neutral"} className="font-black text-[9px] px-2.5 py-1 rounded-lg">
            {isPending ? "READY" : "PAGADO"}
          </Badge>
          {group.billRequested && (
            <span className="flex items-center gap-1 text-[9px] font-black text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-lg animate-pulse">
              <Bell className="w-3 h-3" />CUENTA
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-2 mb-6">
        {previewItems.map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="flex justify-between items-center group/item">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-muted-foreground bg-muted w-6 h-6 flex items-center justify-center rounded-lg">
                {item.quantity}
              </span>
              <span className="text-xs font-bold text-muted-foreground group-hover/item:text-foreground transition-colors truncate max-w-[120px]">
                {item.menuItem?.name ?? "Item"}
              </span>
            </div>
            <span className="text-xs font-black text-muted-foreground font-mono">
              {formatCLP(Number(item.unitPrice) * item.quantity)}
            </span>
          </div>
        ))}
        {extraCount > 0 && (
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center pt-1">
            + {extraCount} ítems adicionales
          </p>
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-border space-y-4">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total a Cobrar</span>
          <span className="text-2xl font-black text-success tracking-tighter">{formatCLP(group.tipIncluded ? group.total * 1.1 : group.total)}</span>
        </div>

        {isPending ? (
          <Button className={`w-full h-16 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl ${
            group.billRequested
              ? "bg-warning text-warning-foreground hover:bg-warning/90 shadow-warning/20"
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
          }`}>
            Procesar Pago <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3 bg-muted rounded-2xl border border-border">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pagado</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function orderTotal(order: Order): number {
  return (order.orderItems ?? []).reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0);
}

export function groupOrders(orders: Order[], billMap: Record<string, boolean>, tipMap: Record<string, boolean> = {}): TableGroup[] {
  const map = new Map<string, TableGroup>();
  for (const order of orders) {
    const key = order.sessionId ?? order.tableId ?? order.id;
    if (!map.has(key)) {
      map.set(key, {
        key,
        tableId:          order.tableId ?? null,
        sessionId:        order.sessionId ?? null,
        tableNumber:      order.table?.number ?? null,
        orders:           [],
        total:            0,
        billRequested:    order.tableId ? (billMap[order.tableId] ?? false) : false,
        tipIncluded:      order.tableId ? (tipMap[order.tableId] ?? false) : false,
        oldestCreatedAt:  order.createdAt,
      });
    }
    const g = map.get(key)!;
    g.orders.push(order);
    g.total += orderTotal(order);
  }
  return Array.from(map.values());
}
