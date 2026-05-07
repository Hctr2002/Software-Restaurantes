"use client";

import { UtensilsCrossed } from "lucide-react";

type ReadyOrder = {
  id: string;
  table_id: string | null;
  tables: { number: number } | null;
  order_items: { id: string; quantity: number; menu_items: { name: string } | null }[];
};

interface Props {
  orders: ReadyOrder[];
}

export function ReadyOrdersBanner({ orders }: Props) {
  if (orders.length === 0) return null;

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="w-5 h-5 text-emerald-400" />
        <h3 className="font-black text-sm text-emerald-400 uppercase tracking-widest">
          Listos para servir ({orders.length})
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between"
          >
            <div>
              <p className="font-black text-foreground text-sm">Mesa {order.tables?.number ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground">{order.order_items.length} ítem(s)</p>
            </div>
            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg uppercase tracking-wider">
              LISTO
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
