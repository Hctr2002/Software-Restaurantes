"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { Wallet, TrendingUp, ReceiptText, ClipboardList } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { formatPrice } from "../../lib/utils";
import { StatsData } from "./dashboardTypes";

interface KpiGridProps {
  stats: StatsData | any;
  activeOrdersCount: number;
}

export function KpiCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <Card className="border-white/5 bg-white/5 backdrop-blur-xl rounded-[2.5rem] hover:bg-white/10 transition-all duration-500 group overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity group-hover:scale-150 transition-transform duration-700">
        {icon}
      </div>
      <CardContent className="pt-8 px-8 pb-8 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            {React.cloneElement(icon as React.ReactElement<any>, { className: "w-3 h-3 text-primary" })}
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">{label}</p>
        </div>
        <p className="text-3xl font-black tracking-tighter text-white">{value}</p>
        <p className="text-[10px] font-bold text-slate-600 mt-2 uppercase tracking-widest">{detail}</p>
      </CardContent>
    </Card>
  );
}

export function KpiGrid({ stats, activeOrdersCount }: KpiGridProps) {
  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <motion.div variants={itemVariants}>
        <KpiCard
          icon={<Wallet className="w-5 h-5 text-emerald-400" />}
          label="Ingresos Hoy"
          value={formatPrice(stats?.ingresos_dia ?? 0)}
          detail={`${stats?.pedidos_dia ?? 0} pedidos hoy`}
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <KpiCard
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
          label="Ingresos Mes"
          value={formatPrice(stats?.ingresos_mes ?? 0)}
          detail="Ventas acumuladas"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <KpiCard
          icon={<ReceiptText className="w-5 h-5 text-amber-400" />}
          label="Ticket Promedio"
          value={formatPrice(stats?.ticket_promedio ?? 0)}
          detail="Hoy por entrega"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <KpiCard
          icon={<ClipboardList className="w-5 h-5 text-rose-400" />}
          label="Pedidos Activos"
          value={String(activeOrdersCount)}
          detail="Pendientes/Cocina"
        />
      </motion.div>
    </div>
  );
}
