"use client";

import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { Clock, CheckCircle2, PlayCircle, Utensils } from "lucide-react";

export type OrderStatus = "PENDING" | "VALIDATED" | "PREPARING" | "READY" | "DELIVERED";

interface OrderItem {
  id: string;
  quantity: number;
  menu_item: {
    name: string;
  };
}

interface OrderTicketProps {
  id: string;
  tableNumber: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
  onStatusChange: (newStatus: OrderStatus) => void;
}

export const OrderTicket = ({ id, tableNumber, status, createdAt, items, onStatusChange }: OrderTicketProps) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(createdAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000 / 60));
    }, 10000); // Actualizar cada 10s

    setElapsed(Math.floor((Date.now() - start) / 1000 / 60));
    return () => clearInterval(interval);
  }, [createdAt]);

  const isDelayed = elapsed >= 15;

  const statusConfigs = {
    PENDING:   { border: "border-navy/10",          bg: "bg-navy/5",           icon: Clock },
    VALIDATED: { border: "border-yellow-500/30",    bg: "bg-yellow-500/5",     icon: Clock },
    PREPARING: { border: "border-brand-accent/40",  bg: "bg-brand-accent/5",   icon: PlayCircle },
    READY:     { border: "border-sage/40",           bg: "bg-sage/5",           icon: CheckCircle2 },
    DELIVERED: { border: "border-navy/50",           bg: "bg-navy/10",          icon: CheckCircle2 },
  };

  const config = statusConfigs[status];

  return (
    <div className={cn(
      "relative flex flex-col p-6 rounded-[2rem] border glass",
      config.border,
      config.bg,
      isDelayed && status !== "READY" && "border-brand-accent/60 bg-brand-accent/10 shadow-lg shadow-brand-accent/20"
    )}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
            <span className="text-2xl font-black text-navy">{tableNumber}</span>
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-navy/40">Mesa</p>
            <p className="text-xs font-bold text-navy/60">{id.slice(0, 8)}</p>
          </div>
        </div>
        <div className={cn("px-4 py-2 rounded-full flex items-center space-x-2", isDelayed ? "bg-brand-accent/20 text-brand-accent" : "bg-white/5 text-navy/40")}>
          <Clock className="w-4 h-4" />
          <span className="text-[11px] font-bold tracking-widest">{elapsed}M</span>
        </div>
      </div>

      <div className="flex-1 space-y-4 mb-8">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-3">
              <span className="w-7 h-7 rounded-xl bg-navy/5 flex items-center justify-center text-[11px] font-black text-brand-accent border border-navy/5">
                {item.quantity}
              </span>
              <span className="font-semibold text-navy/80">{item.menu_item.name}</span>
            </div>
            <Utensils className="w-4 h-4 text-navy/20" />
          </div>
        ))}
      </div>

      <div className="flex space-x-3">
        {(status === "PENDING" || status === "VALIDATED") && (
          <button
            onClick={() => onStatusChange("PREPARING")}
            className="flex-1 py-3 bg-navy text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-navy/90 transition-all flex items-center justify-center space-x-2"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Preparar</span>
          </button>
        )}
        {status === "PREPARING" && (
          <button
            onClick={() => onStatusChange("READY")}
            className="flex-1 py-3 bg-sage text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-sage/90 transition-all flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Listo</span>
          </button>
        )}
      </div>
    </div>
  );
};
