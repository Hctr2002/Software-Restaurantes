"use client";

/**
 * PendingOrderCard — Tarjeta de pedido pendiente para el terminal del garzón.
 * Muestra los ítems de cocina y bar por separado, campos de notas editables y
 * botones de validar/rechazar. Usado en la columna "Solicitados" del terminal.
 */

import React from "react";
import { CheckCircle, Loader2, MessageSquare, Wine, XCircle } from "lucide-react";
import { Button } from "../ui/button";

export type PendingOrder = {
  id: string;
  status: string;
  tableId: string | null;
  totalAmount: number;
  createdAt: string;
  table: { number: number } | null;
  orderItems: { id: string; quantity: number; menu_items: { name: string } | null }[];
};

interface PendingOrderCardProps {
  order: any;
  note: string;
  barNote?: string;
  processingId: string | null;
  savingNoteId: string | null;
  onNoteChange: (id: string, value: string) => void;
  onSaveNote: (id: string) => void;
  onBarNoteChange?: (id: string, value: string) => void;
  onSaveBarNote?: (id: string) => void;
  onValidate: (order: any) => void;
  onReject: (order: any) => void;
}

export function PendingOrderCard({
  order, note, barNote = "", processingId, savingNoteId,
  onNoteChange, onSaveNote, onBarNoteChange, onSaveBarNote, onValidate, onReject,
}: PendingOrderCardProps) {
  const isProcessing = processingId === order.id;

  return (
    <div className="bg-card border border-border/40 rounded-[2rem] p-6 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-black tracking-tighter text-foreground">
            Mesa {order.table?.number ?? "—"}
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">
            {order.orderItems?.length ?? 0} ítem(s)
          </p>
        </div>
        <span className="text-[10px] font-black text-amber-600 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-wider">
          PENDIENTE
        </span>
      </div>

      {/* Items preview */}
      <div className="space-y-2">
        {order.orderItems?.slice(0, 4).map((item: any) => (
          <div key={item.id} className="flex items-center gap-3 text-sm">
            <span className="w-7 h-7 flex items-center justify-center bg-foreground/5 rounded-xl text-xs font-black text-muted-foreground">
              {item.quantity}
            </span>
            <span className="text-foreground/80 font-bold truncate">
              {item.menu_items?.name ?? "Item"}
            </span>
          </div>
        ))}
        {(order.orderItems?.length ?? 0) > 4 && (
          <p className="text-[10px] text-muted-foreground pl-10 font-bold uppercase tracking-widest opacity-50">+{(order.orderItems?.length ?? 0) - 4} más</p>
        )}
      </div>

      {/* Nota de cocina */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          <MessageSquare className="w-3.5 h-3.5" />
          Nota de cocina
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ej: Sin sal, alergia a mariscos…"
            value={note}
            onChange={(e) => onNoteChange(order.id, e.target.value)}
            className="flex-1 text-xs px-4 py-2.5 rounded-xl bg-foreground/[0.03] border border-foreground/10 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <button
            onClick={() => onSaveNote(order.id)}
            disabled={savingNoteId === order.id || !note}
            className="px-4 py-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-xs font-black text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all disabled:opacity-30"
          >
            {savingNoteId === order.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "OK"}
          </button>
        </div>
      </div>

      {/* Nota de bar — solo visible si el pedido tiene un sub-pedido de barra */}
      {order.barSubOrderId && onBarNoteChange && onSaveBarNote && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black text-amber-600/80 uppercase tracking-widest">
            <Wine className="w-3.5 h-3.5" />
            Nota de bar
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ej: Sin hielo, vaso grande…"
              value={barNote}
              onChange={(e) => onBarNoteChange(order.barSubOrderId, e.target.value)}
              className="flex-1 text-xs px-4 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
            <button
              onClick={() => onSaveBarNote(order.barSubOrderId)}
              disabled={savingNoteId === order.barSubOrderId || !barNote}
              className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-black text-amber-600/80 hover:text-amber-700 hover:bg-amber-500/20 transition-all disabled:opacity-30"
            >
              {savingNoteId === order.barSubOrderId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "OK"}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={() => onReject(order)}
          disabled={isProcessing}
          variant="outline"
          className="flex-1 h-12 rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/40 font-black text-[10px] uppercase tracking-widest gap-2 transition-all active:scale-95"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          Rechazar
        </Button>
        <Button
          onClick={() => onValidate(order)}
          disabled={isProcessing}
          className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 border-none"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Validar
        </Button>
      </div>
    </div>
  );
}
