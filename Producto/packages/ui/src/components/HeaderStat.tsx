"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

interface HeaderStatProps {
  label: string;
  value: number | string;
  color?: string;
  className?: string;
}

export const HeaderStat = ({ label, value, color, className }: HeaderStatProps) => {
  return (
    <div className={cn("text-center group px-4", className)}>
      <p className="text-[9px] font-black text-muted-foreground uppercase mb-1 tracking-[0.2em] group-hover:text-foreground transition-colors">
        {label}
      </p>
      <AnimatePresence mode="popLayout">
        <motion.p
          key={value}
          initial={{ opacity: 0, y: -8, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className={cn("text-2xl font-black tracking-tighter leading-none", color || "text-foreground")}
        >
          {value}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
