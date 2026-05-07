"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface Props {
  title: string;
  count: number;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

export function KDSColumn({ title, count, icon, children, active }: Props) {
  return (
    <motion.div
      layout
      className={cn(
        "flex flex-col h-full glass-premium rounded-[3rem] border border-white/5 overflow-hidden transition-all duration-700",
        active ? "bg-primary/[0.03] border-primary/20 ring-1 ring-primary/10 shadow-2xl shadow-primary/5" : "shadow-xl"
      )}
    >
      <div className="p-8 flex justify-between items-center border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center space-x-4">
          <div className={cn("p-2 rounded-xl", active ? "bg-primary/20" : "bg-white/5")}>{icon}</div>
          <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-foreground/60">{title}</h3>
        </div>
        <span className={cn("px-4 py-1.5 rounded-full text-xs font-black shadow-lg", active ? "bg-primary text-primary-foreground" : "bg-white/10 text-foreground")}>
          {count}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {children}
        {count === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center opacity-10 space-y-4">
            <div className="w-20 h-20 border-2 border-dashed border-foreground rounded-full flex items-center justify-center">{icon}</div>
            <p className="font-black uppercase tracking-[0.2em] text-[10px]">Sin actividad</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
