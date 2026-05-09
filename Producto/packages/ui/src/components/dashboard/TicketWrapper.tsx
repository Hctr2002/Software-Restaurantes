"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface Props {
  createdAt: string;
  thresholds: { yellow: number; red: number };
  status: string;
  children: React.ReactNode;
}

const URGENCY_RING: Record<"green" | "yellow" | "red", string> = {
  green:  "ring-2 ring-emerald-500/30",
  yellow: "ring-2 ring-yellow-500/50 shadow-md shadow-yellow-500/10",
  red:    "ring-2 ring-red-500/60 shadow-lg shadow-red-500/20",
};

export function TicketWrapper({ createdAt, thresholds, status, children }: Props) {
  // Simple urgency logic integrated
  const getUrgency = () => {
    if (status === "READY") return "green";
    const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (elapsed >= thresholds.red) return "red";
    if (elapsed >= thresholds.yellow) return "yellow";
    return "green";
  };

  const urgency = getUrgency();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      className={cn("rounded-[2.5rem]", URGENCY_RING[urgency])}
    >
      {children}
    </motion.div>
  );
}
