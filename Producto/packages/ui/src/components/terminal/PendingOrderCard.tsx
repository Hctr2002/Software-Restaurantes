"use client";

import React from "react";
import { CheckCircle, Loader2, MessageSquare, XCircle } from "lucide-react";
import { Button } from "../ui/button";

export type PendingOrder = {
  id: string;
  status: string;
  table_id: string | null;
  total_amount: number;
  createdAt: string;
  tables: { number: number } | null;
  order_items: { id: string; quantity: number; menu_items: { name: string } | null }[];
};

interface PendingOrderCardProps {
  order: PendingOrder;
  note: string;
  processingId: string | null;
  savingNoteId: string | null;
  onNoteChange: (id: string, value: string) => void;
  onSaveNote: (id: string) => void;
  onValidate: (order: PendingOrder) => void;
  onReject: (order: PendingOrder) => void;
}

export function PendingOrderCard({
  order, note, processingId, savingNoteId,
  onNoteChange, onSaveNote, onValidate, onReject,
}: PendingOrderCardProps) {
  const isProcessing = processingId === order.id;

  return (
    <div className="bg-card border border-border/10 rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-black tracking-tighter text-foreground">
            Mesa {order.tables?.number ?? "—"}
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
            {order.order_items.length} ítem(s)
          </p>
        </div>
        <span className="text-[9px] font-black text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-lg uppercase tracking-wider">
          PENDIENTE
        </span>
      </div>

      {/* Items preview */}
      <div className="space-y-1.5">
        {order.order_items.slice(0, 4).map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            <span className="w-6 h-6 flex items-center justify-center bg-foreground/5 rounded-lg text-xs font-black text-muted-foreground">
              {item.quantity}
            </span>
            <span className="text-foreground/70 font-medium truncate">
              {item.menu_items?.name ?? "Item"}
            </span>
          </div>
        ))}
        {order.order_items.length > 4 && (
          <p className="text-[10px] text-muted-foreground pl-8">+{order.order_items.length - 4} más</p>
        )}
      </div>

      {/* Nota de cocina */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          <MessageSquare className="w-3 h-3" />
          Nota de cocina
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ej: Sin sal, alergia a mariscos…"
            value={note}
            onChange={(e) => onNoteChange(order.id, e.target.value)}
            className="flex-1 text-xs px-3 py-2 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            onClick={() => onSaveNote(order.id)}
            disabled={savingNoteId === order.id || !note}
            className="px-3 py-2 rounded-xl bg-foreground/5 border border-foreground/10 text-xs font-black text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all disabled:opacity-30"
          >
            {savingNoteId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "OK"}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={() => onReject(order)}
          disabled={isProcessing}
          variant="outline"
          className="flex-1 h-11 rounded-xl border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 font-black text-xs uppercase tracking-widest gap-2"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          Rechazar
        </Button>
        <Button
          onClick={() => onValidate(order)}
          disabled={isProcessing}
          className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-emerald-600/20"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Validar
        </Button>
      </div>
    </div>
  );
}
