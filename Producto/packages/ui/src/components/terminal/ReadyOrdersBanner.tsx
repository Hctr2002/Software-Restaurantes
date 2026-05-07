"use client";

import React from "react";
import { UtensilsCrossed, CheckCircle } from "lucide-react";

type ReadyOrder = {
  id: string;
  table_id: string | null;
  tables: { number: number } | null;
  order_items: { id: string; quantity: number; menu_items: { name: string } | null }[];
};

interface ReadyOrdersBannerProps {
  orders: ReadyOrder[];
  onDeliver: (id: string) => void;
}

export function ReadyOrdersBanner({ orders, onDeliver }: ReadyOrdersBannerProps) {
  if (orders.length === 0) return null;

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 space-y-3 w-full">
      <div className="flex items-center gap-2 mb-2">
        <UtensilsCrossed className="w-5 h-5 text-emerald-400" />
        <h3 className="font-black text-sm text-emerald-400 uppercase tracking-widest">
          Listos para servir ({orders.length})
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex flex-col gap-4 shadow-lg shadow-emerald-500/5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-foreground text-lg tracking-tighter">Mesa {order.tables?.number ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{order.order_items.length} ítem(s)</p>
              </div>
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg uppercase tracking-wider">
                LISTO
              </span>
            </div>
            
            <div className="space-y-1">
              {order.order_items.slice(0, 3).map(item => (
                <p key={item.id} className="text-xs text-foreground/60 truncate font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                  {item.quantity}x {item.menu_items?.name}
                </p>
              ))}
              {order.order_items.length > 3 && (
                <p className="text-[9px] text-muted-foreground italic">...y {order.order_items.length - 3} más</p>
              )}
            </div>

            <button
              onClick={() => onDeliver(order.id)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle className="w-4 h-4" />
              Retirar de Cocina
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
