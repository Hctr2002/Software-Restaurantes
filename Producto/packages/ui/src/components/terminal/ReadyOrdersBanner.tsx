"use client";

import React from "react";
import { UtensilsCrossed, CheckCircle } from "lucide-react";

type ReadyOrder = {
  id: string;
  tableId: string | null;
  table: { number: number } | null;
  orderItems: { id: string; quantity: number; menu_items: { name: string } | null }[];
};

interface ReadyOrdersBannerProps {
  orders: any[];
  onDeliver: (id: string, order: any) => void;
}

export function ReadyOrdersBanner({ orders, onDeliver }: ReadyOrdersBannerProps) {
  if (orders.length === 0) return null;

  return (
    <div className="bg-card border border-emerald-500/30 rounded-[2.5rem] p-6 space-y-4 w-full shadow-xl shadow-emerald-500/5">
      <div className="flex items-center gap-3 mb-2 px-2">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <UtensilsCrossed className="w-5 h-5 text-emerald-500" />
        </div>
        <h3 className="font-black text-sm text-emerald-500 uppercase tracking-widest">
          Listos para servir ({orders.length})
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-foreground/[0.02] border border-border/40 rounded-[2rem] p-6 flex flex-col gap-5 transition-all hover:border-emerald-500/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-foreground text-xl tracking-tighter">Mesa {order.table?.number ?? "—"}</p>
                <div className="flex gap-2 mt-1.5">
                  {(order.station === 'KITCHEN' || !order.station) && (
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">Cocina</span>
                  )}
                  {(order.station === 'BAR' || !order.station) && (
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 uppercase tracking-widest">Bar</span>
                  )}
                </div>
              </div>
              <span className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full uppercase tracking-wider">
                LISTO
              </span>
            </div>
            
            <div className="space-y-2">
              {(order.orderItems ?? []).slice(0, 3).map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 text-xs text-foreground/70 font-medium">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   <span className="truncate">{item.quantity}x {item.menuItem?.name || item.menu_items?.name}</span>
                </div>
              ))}
              {(order.orderItems ?? []).length > 3 && (
                <p className="text-[9px] text-muted-foreground italic pl-4">...y {(order.orderItems ?? []).length - 3} más</p>
              )}
            </div>

            <button
              onClick={() => onDeliver(order.id, order)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle className="w-4 h-4" />
              Entregar Pedido
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
