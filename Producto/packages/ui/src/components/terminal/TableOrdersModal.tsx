"use client";

import React from "react";
import { X, Receipt, Clock, CheckCircle2, Utensils, Beer, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { Order, TableRecord, OrderStatus } from "@menu-bites/auth";

interface TableOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableRecord | null;
  orders: Order[];
  onTakeOrder: (tableId: string) => void;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  PENDING:   { label: "PENDIENTE",  color: "text-amber-500 bg-amber-500/10 border-amber-500/30", icon: Clock },
  VALIDATED: { label: "VALIDADO",   color: "text-blue-500 bg-blue-500/10 border-blue-500/30",   icon: Timer },
  PREPARING: { label: "PREPARANDO", color: "text-primary bg-primary/10 border-primary/30",      icon: Utensils },
  READY:     { label: "LISTO",      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle2 },
  PARCIAL:   { label: "PARCIAL",    color: "text-orange-500 bg-orange-500/10 border-orange-500/30",  icon: Beer },
  DELIVERED: { label: "ENTREGADO",  color: "text-sky-500 bg-sky-500/10 border-sky-500/30",      icon: Receipt },
  COMPLETED: { label: "PAGADO",     color: "text-gray-500 bg-gray-500/10 border-gray-500/30",   icon: CheckCircle2 },
  REJECTED:  { label: "RECHAZADO",  color: "text-red-500 bg-red-500/10 border-red-500/30",      icon: X },
};

export function TableOrdersModal({ isOpen, onClose, table, orders, onTakeOrder }: TableOrdersModalProps) {
  if (!isOpen || !table) return null;

  const tableOrders = orders.filter(o => o.tableId === table.id);
  const totalAmount = tableOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/90"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-card border border-border/40 rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 lg:p-10 border-b border-border/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center border border-primary/20">
              <Receipt className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter leading-none">Mesa {table.number}</h2>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-2 opacity-60">
                {tableOrders.length} Pedido(s) en curso
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-8 custom-scrollbar">
          {tableOrders.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-center opacity-40">
              <Utensils className="w-12 h-12 mb-4" />
              <p className="font-black uppercase tracking-widest text-[10px]">Sin pedidos activos</p>
            </div>
          ) : (
            <div className="space-y-6">
              {tableOrders.map((order) => {
                const StatusIcon = STATUS_CONFIG[order.status]?.icon || Clock;
                const items = order.orderItems || order.order_items || [];
                return (
                  <div key={order.id} className="bg-white/5 border border-white/5 rounded-[2rem] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider ${STATUS_CONFIG[order.status]?.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {STATUS_CONFIG[order.status]?.label}
                      </div>
                      <span className="text-[10px] font-black text-muted-foreground opacity-40">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 flex items-center justify-center bg-white/5 rounded-lg text-[10px] font-black text-primary">
                              {item.quantity}
                            </span>
                            <span className="text-sm font-medium text-foreground/80">
                              {item.menuItem?.name || item.menu_items?.name || "Item"}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-muted-foreground">
                            ${((item.unitPrice || item.unit_price || 0) * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="pt-3 border-t border-white/5">
                        <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest mb-1 ml-1">Notas</p>
                        <p className="text-xs text-foreground/60 italic px-3 py-2 bg-black/20 rounded-xl">"{order.notes}"</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 lg:p-10 border-t border-border/40 bg-foreground/[0.02] rounded-b-[3rem] shrink-0">
          <div className="flex items-center justify-between mb-8">
            <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Consumo Total</span>
            <span className="text-3xl font-black tracking-tighter text-primary">${totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={onClose} className="flex-1 h-16 rounded-2xl border-border/40 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-foreground/5">
              Cerrar
            </Button>
            <Button onClick={() => onTakeOrder(table.id)} className="flex-1 h-16 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-primary/90">
              Tomar Comanda
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
