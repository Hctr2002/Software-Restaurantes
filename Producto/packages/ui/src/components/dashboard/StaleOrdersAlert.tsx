"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Order } from "./dashboardTypes";

interface StaleOrdersAlertProps {
  orders: Order[];
  staleMinutes: number;
}

export const StaleOrdersAlert: React.FC<StaleOrdersAlertProps> = ({ 
  orders, 
  staleMinutes 
}) => {
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const staleOrders = orders.filter((o) => {
    if (o.status !== "PENDING") return false;
    const diff = (now - new Date(o.createdAt).getTime()) / 60000;
    return diff > staleMinutes;
  });

  if (staleOrders.length === 0) return null;

  return (
    <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex items-start gap-4 p-5 rounded-[2.5rem] border border-destructive/20 bg-destructive/5 text-destructive shadow-lg shadow-destructive/5"
        >
          <div className="p-2.5 rounded-2xl bg-red-500/10 shrink-0 mt-0.5 border border-red-500/10">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-widest mb-1 text-red-500/80">
              {staleOrders.length} pedido{staleOrders.length > 1 ? "s" : ""} sin validar — más de {staleMinutes} minutos
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {staleOrders.map((o) => (
                <span key={o.id} className="text-[10px] font-black bg-destructive/10 px-3 py-1.5 rounded-xl border border-destructive/10">
                  Mesa {o.table?.number ?? "S/N"} · {Math.round((now - new Date(o.createdAt).getTime()) / 60000)}min
                </span>
              ))}
            </div>
          </div>
        </motion.div>
    </AnimatePresence>
  );
};
