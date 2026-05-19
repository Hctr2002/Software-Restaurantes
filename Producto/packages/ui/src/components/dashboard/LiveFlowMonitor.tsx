"use client";

/**
 * LiveFlowMonitor — Monitor de flujo de pedidos en tiempo real para el dashboard.
 * Muestra los pedidos activos con su tiempo transcurrido y estado (PENDING, PREPARING, READY).
 * Resalta pedidos que superan el umbral de tiempo de alerta.
 */

import React from "react";
import { Flame, Timer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Order } from "./dashboardTypes";

interface LiveFlowMonitorProps {
  orders: Order[] | any[];
}

export function LiveFlowMonitor({ orders }: LiveFlowMonitorProps) {
  const flowCounts = {
    PENDING:    orders.filter((o) => o.status === "PENDING").length,
    VALIDATED:  orders.filter((o) => o.status === "VALIDATED").length,
    PREPARING:  orders.filter((o) => o.status === "PREPARING").length,
    READY:      orders.filter((o) => o.status === "READY").length,
  };

  const deliveredWithTime = orders.filter((o) => o.status === "DELIVERED" && o.ready_at && o.createdAt);
  const avgCycleMin = deliveredWithTime.length > 0
    ? Math.round(deliveredWithTime.reduce((s, o) => {
        return s + (new Date(o.ready_at!).getTime() - new Date(o.createdAt).getTime()) / 60000;
      }, 0) / deliveredWithTime.length)
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border-border bg-card rounded-[2.5rem] overflow-hidden shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-foreground text-base">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Flame className="w-4 h-4 text-primary" />
            </div>
            Flujo en Vivo
          </CardTitle>
          <CardDescription className="text-muted-foreground font-medium text-xs">Estado de órdenes en curso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Pendiente",   count: flowCounts.PENDING,   color: "text-amber-500/90",  bg: "bg-amber-500/5 border-amber-500/10" },
              { label: "Validado",    count: flowCounts.VALIDATED,  color: "text-blue-500/90",    bg: "bg-blue-500/5 border-blue-500/10" },
              { label: "Preparando",  count: flowCounts.PREPARING,  color: "text-primary",     bg: "bg-primary/5 border-primary/10" },
              { label: "Listo",       count: flowCounts.READY,      color: "text-emerald-500/90", bg: "bg-emerald-500/5 border-emerald-500/10" },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className={`flex flex-col items-center p-3 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${bg}`}>
                <span className={`text-2xl font-black tracking-tighter ${color}`}>{count}</span>
                <span className="text-[9px] font-black text-foreground/40 uppercase tracking-widest mt-1 text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card rounded-[2.5rem] overflow-hidden shadow-lg border-l-4 border-l-amber-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-foreground text-base">
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <Timer className="w-4 h-4 text-amber-500" />
            </div>
            Tiempo Promedio Hoy
          </CardTitle>
          <CardDescription className="text-muted-foreground font-medium text-xs">Ciclo completo pedido → listo</CardDescription>
        </CardHeader>
        <CardContent>
          {avgCycleMin === null ? (
            <p className="text-sm text-foreground/30 italic">Sin entregas con timestamps hoy.</p>
          ) : (
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black tracking-tighter text-amber-500/90">{avgCycleMin}</span>
              <span className="text-sm font-black text-foreground/40 uppercase tracking-widest pb-1">min</span>
              <div className="ml-auto">
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border ${
                  avgCycleMin > 30 ? "bg-red-500/10 border-red-500/20 text-red-500/90" :
                  avgCycleMin > 15 ? "bg-amber-500/10 border-amber-500/20 text-amber-500/90" :
                  "bg-emerald-500/10 border-emerald-500/20 text-emerald-500/90"
                }`}>
                  {avgCycleMin > 30 ? "Lento" : avgCycleMin > 15 ? "Normal" : "Óptimo"}
                </span>
              </div>
            </div>
          )}
          <p className="text-[10px] text-foreground/20 mt-3">
            Basado en {deliveredWithTime.length} entrega{deliveredWithTime.length !== 1 ? "s" : ""} hoy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
