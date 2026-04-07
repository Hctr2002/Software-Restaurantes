"use client";

import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { Clock, CheckCircle2, PlayCircle, Utensils } from "lucide-react";

export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "DELIVERED";

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
    PENDING: { border: "border-slate-500/20", bg: "bg-slate-500/5", icon: Clock },
    PREPARING: { border: "border-primary/40", bg: "bg-primary/5", icon: PlayCircle },
    READY: { border: "border-emerald-500/40", bg: "bg-emerald-500/5", icon: CheckCircle2 },
    DELIVERED: { border: "border-slate-800", bg: "bg-slate-900/50", icon: CheckCircle2 },
  };

  const config = statusConfigs[status];

  return (
    <div className={cn(
      "relative flex flex-col p-5 rounded-3xl border glass transition-all duration-500 animate-in zoom-in-95",
      config.border,
      config.bg,
      isDelayed && status !== "READY" && "border-destructive/60 bg-destructive/10 shadow-lg shadow-destructive/20 animate-pulse"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
            <span className="text-xl font-black text-white">{tableNumber}</span>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Mesa</p>
            <p className="text-xs font-medium text-white/50">{id.slice(0, 8)}</p>
          </div>
        </div>
        <div className={cn("px-3 py-1 rounded-full flex items-center space-x-1.5", isDelayed ? "bg-destructive/20 text-destructive" : "bg-white/5 text-muted-foreground")}>
          <Clock className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold">{elapsed}m</span>
        </div>
      </div>

      <div className="flex-1 space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-primary border border-white/5">
                {item.quantity}
              </span>
              <span className="font-medium text-white/80">{item.menu_item.name}</span>
            </div>
            <Utensils className="w-3.5 h-3.5 opacity-20" />
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        {status === "PENDING" && (
          <button 
            onClick={() => onStatusChange("PREPARING")}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center space-x-2"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Preparar</span>
          </button>
        )}
        {status === "PREPARING" && (
          <button 
            onClick={() => onStatusChange("READY")}
            className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Listo</span>
          </button>
        )}
      </div>
    </div>
  );
};
