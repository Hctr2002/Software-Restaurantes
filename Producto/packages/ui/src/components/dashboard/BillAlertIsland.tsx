"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import { TableGroup } from "./dashboardTypes";

interface Props {
  groups: TableGroup[];
  onSelect: (group: TableGroup) => void;
}

export function BillAlertIsland({ groups, onSelect }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const alertGroups = groups.filter((g) => g.billRequested && !dismissed.has(g.key));
  if (alertGroups.length === 0) return null;

  const handleClick = (g: TableGroup) => {
    setDismissed((prev) => new Set([...prev, g.key]));
    onSelect(g);
  };

  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-4 pointer-events-none">
      <AnimatePresence>
        {alertGroups.map((g) => (
          <motion.div
            key={`alert-${g.key}`}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            onClick={() => handleClick(g)}
            className="pointer-events-auto cursor-pointer bg-card/90 backdrop-blur-xl border border-yellow-500/50 rounded-2xl p-5 shadow-2xl flex items-center gap-4 w-72 hover:border-yellow-500/80 hover:bg-card transition-colors"
          >
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
              <Bell className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Cuenta Solicitada</p>
              <p className="text-sm font-black text-foreground">Mesa {g.tableNumber ?? "S/N"}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
