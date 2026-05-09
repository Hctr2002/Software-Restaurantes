"use client";

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
        En Cocina ({orders.length})
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
              <div className="bg-card/40 border border-white/5 rounded-2xl p-5 flex flex-col gap-4 opacity-80">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-black tracking-tighter text-foreground">
                      Mesa {order.table?.number ?? "—"}
                    </h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                      {order.order_items?.length ?? 0} ítem(s)
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
                      order.status === "PREPARING"
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-white/5 text-muted-foreground border border-white/10"
                    }`}
                  >
                    {order.status === "PREPARING" ? "PREPARANDO" : "EN COLA"}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 flex items-center justify-center bg-foreground/5 rounded text-[10px] font-black text-muted-foreground">
                        {item.quantity}
                      </span>
                      <span className="text-foreground/60 font-medium truncate">
                        {item.menu_items?.name ?? "Item"}
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
