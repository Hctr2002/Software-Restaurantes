"use client";

import React from "react";
import { cn } from "../lib/utils";
import { Users } from "lucide-react";

export type TableStatus = "FREE" | "OCCUPIED" | "RESERVED";

interface TableCardProps {
  number: number;
  status: TableStatus;
  label?: string;
  onClick?: () => void;
}

export const TableCard = ({ number, status, label, onClick }: TableCardProps) => {
  const statusConfig = {
    FREE: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10",
    OCCUPIED: "border-orange-500/20 bg-orange-500/5 text-orange-400 cursor-not-allowed opacity-80",
    RESERVED: "border-amber-500/20 bg-amber-500/5 text-amber-500",
  };

  return (
    <button
      onClick={status === "FREE" ? onClick : undefined}
      className={cn(
        "relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 glass group",
        statusConfig[status]
      )}
    >
      <div className="absolute top-2 right-3 text-[10px] uppercase font-bold tracking-tighter opacity-40">
        Mesa
      </div>
      <span className="text-4xl font-black mb-1 group-hover:scale-110 transition-transform">
        {number}
      </span>
      {label && <span className="text-xs opacity-60 font-medium truncate w-full px-2">{label}</span>}
      <div className="mt-2 flex items-center space-x-1">
        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", 
          status === "FREE" ? "bg-emerald-500" : status === "OCCUPIED" ? "bg-orange-500" : "bg-amber-500")} 
        />
        <span className="text-[10px] uppercase tracking-widest font-bold">
          {status === "FREE" ? "Libre" : status === "OCCUPIED" ? "Ocupada" : "Reservada"}
        </span>
      </div>
    </button>
  );
};

export const TableGrid = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {children}
    </div>
  );
};
