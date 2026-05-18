"use client";

/**
 * PreparingOrdersList — Lista compacta de pedidos en preparación (PREPARING).
 * Usada en la columna central del terminal del garzón para seguimiento de pedidos en curso.
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Order } from "../dashboard/dashboardTypes";

interface PreparingOrdersListProps {
  orders: Order[];
}

export const PreparingOrdersList: React.FC<PreparingOrdersListProps> = ({ orders }) => {
  if (orders.length === 0) return null;

  return (
    <div className="space-y-4 pt-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-primary/80 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        En Preparación ({orders.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="bg-card border border-border/40 rounded-[2rem] p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-black tracking-tighter text-foreground">
                      Mesa {order.table?.number ?? "—"}
                    </h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">
                      {(order.orderItems ?? (order as any).order_items)?.length ?? 0} ítem(s)
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${
                      order.status === "PREPARING"
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-foreground/5 text-muted-foreground border border-border/40"
                    }`}
                  >
                    {order.status === "PREPARING" ? "PREPARANDO" : "EN COLA"}
                  </span>
                </div>
                <div className="space-y-2">
                  {(order.orderItems ?? (order as any).order_items ?? []).map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      <span className="w-6 h-6 flex items-center justify-center bg-foreground/5 rounded-lg text-[10px] font-black text-muted-foreground border border-border/20">
                        {item.quantity}
                      </span>
                      <span className="text-foreground/70 font-medium truncate">
                        {item.menuItem?.name ?? item.menu_items?.name ?? "Item"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
