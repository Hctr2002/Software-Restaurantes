"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CreditCard, Hash, Loader2, Receipt } from "lucide-react";
import { formatCLP } from "@menu-bites/auth";
import { Badge } from "../Badge";
import { Button } from "../ui/button";
import { TableGroup } from "./dashboardTypes";

interface Props {
  group: TableGroup;
  paymentReference: string;
  isProcessing: boolean;
  onPaymentRefChange: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function PaymentSlideOver({
  group, paymentReference, isProcessing,
  onPaymentRefChange, onConfirm, onClose,
}: Props) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end p-6 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/40 backdrop-blur-md pointer-events-auto"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-card/95 backdrop-blur-xl h-[calc(100vh-3rem)] shadow-2xl border border-white/10 flex flex-col rounded-[2.5rem] pointer-events-auto"
        >
          {/* Header */}
          <div className="p-10 border-b border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Receipt className="w-32 h-32 rotate-12" />
            </div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <button
                onClick={onClose}
                className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all">
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
              </button>
              <div className="flex items-center gap-2">
                {group.billRequested && (
                  <span className="bg-yellow-500/20 text-yellow-500 text-[9px] font-black px-3 py-1.5 rounded-full border border-yellow-500/30 animate-pulse">
                    CUENTA SOLICITADA
                  </span>
                )}
                <Badge variant="success" className="font-black px-4 py-1.5 rounded-full">TOTAL LISTO</Badge>
              </div>
            </div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-20 h-20 bg-primary rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary/30 border border-white/20">
                <Hash className="w-10 h-10 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-4xl font-black tracking-tighter text-foreground leading-none">
                  {group.tableNumber ? `Mesa ${group.tableNumber}` : "Mesa S/N"}
                </h2>
                <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-2 opacity-60">
                  {group.orders.length} Comanda{group.orders.length !== 1 ? "s" : ""} consolidada{group.orders.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-10 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Detalle de Consumo</h3>
                <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">
                  {group.orders.flatMap((o) => o.orderItems ?? []).length} Ítems
                </span>
              </div>
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
                }}
                className="grid gap-3"
              >
                {group.orders.flatMap((o) => o.orderItems ?? []).map((item, idx) => (
                  <motion.div
                    key={`${item.id}-${idx}`}
                    variants={{ hidden: { x: 20, opacity: 0 }, show: { x: 0, opacity: 1 } }}
                    className="bg-white/5 border border-white/5 rounded-3xl p-5 flex justify-between items-center hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center bg-card rounded-2xl text-xs font-black text-primary border border-white/10 shadow-lg">
                        {item.quantity}
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground/90 leading-tight mb-1">{item.menuItem?.name ?? "Item"}</p>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                          {formatCLP(Number(item.unitPrice))} p/u
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-foreground font-mono">
                      {formatCLP(Number(item.unitPrice) * item.quantity)}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Totals */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-5 relative overflow-hidden group/total">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[80px] -z-10 group-hover/total:bg-emerald-500/20 transition-all" />
              <div className="flex justify-between items-center text-muted-foreground/60">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Neto Consumo</span>
                <span className="text-sm font-black font-mono">{formatCLP(group.total)}</span>
              </div>
              {group.tipIncluded && (
                <div className="flex justify-between items-center text-muted-foreground/60">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Propina Incluida (10%)</span>
                  <span className="text-sm font-black font-mono">{formatCLP(group.total * 0.1)}</span>
                </div>
              )}
              <div className="h-px bg-white/5" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-primary uppercase tracking-[0.2em]">Total Final</span>
                <span className="text-4xl font-black text-emerald-400 tracking-tighter drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  {formatCLP(group.tipIncluded ? group.total * 1.1 : group.total)}
                </span>
              </div>
            </div>

            {/* Referencia */}
            <div className="space-y-2">
              <label htmlFor="payment_ref" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Referencia de Baucher / Pago
              </label>
              <div className="relative group">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                <input
                  id="payment_ref"
                  type="text"
                  placeholder="Ej: #998877"
                  value={paymentReference}
                  onChange={(e) => onPaymentRefChange(e.target.value)}
                  className="w-full bg-background border border-border/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-emerald-500/50 transition-all font-mono text-sm text-foreground"
                />
              </div>
              <p className="text-[9px] text-muted-foreground/60 italic ml-1">Vincule el ticket físico con este registro del sistema.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-10 border-t border-white/5 bg-card/50 backdrop-blur-xl">
            <Button
              onClick={onConfirm}
              disabled={isProcessing}
              className="w-full h-20 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-2xl shadow-emerald-600/30 gap-4 disabled:opacity-50 active:scale-95 group/pay"
            >
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover/pay:bg-white/30 transition-all">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  Finalizar Pago y Cerrar Mesa
                </>
              )}
            </Button>
            <p className="text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-6 opacity-40">
              Esta acción liberará la mesa y generará el comprobante
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
