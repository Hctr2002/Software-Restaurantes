"use client";

/**
 * TableCard — Tarjeta de mesa para la vista de mesas del terminal del garzón.
 * Muestra el número, estado, indicadores de pedidos activos y botón de fusión.
 * Se resalta visualmente según el estado: OCCUPIED (primary), CLEANING (warning), etc.
 */

import React from "react";
import { CheckCircle, Hash, Link2 } from "lucide-react";
import { motion } from "framer-motion";
import { TableRecord } from "@menu-bites/auth";

export type TableStatus = "FREE" | "OCCUPIED" | "CLEANING" | "RESERVED";

interface TableCardProps {
  table: TableRecord & { bill_requested?: boolean; current_session_id?: string | null };
  isBillRequested: boolean;
  isReady: boolean;
  isPreparing: boolean;
  mergeMode: boolean;
  isSelectedForMerge: boolean;
  onSelect: (id: string) => void;
  onNavigate: (id: string) => void;
  mergedTableNumbers?: number[];
  orders?: any[];
}

const STATUS_STYLES: Record<TableStatus, string> = {
  FREE:     "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",
  OCCUPIED: "bg-primary/10 border-primary/30 text-primary",
  CLEANING: "bg-sky-500/10 border-sky-500/30 text-sky-500",
  RESERVED: "bg-amber-500/10 border-amber-500/30 text-amber-500",
};

const STATUS_TEXT: Record<TableStatus, string> = {
  FREE:     "text-emerald-500",
  OCCUPIED: "text-primary",
  CLEANING: "text-sky-500",
  RESERVED: "text-amber-500",
};

export function TableCard({ table, isBillRequested, isReady, isPreparing, mergeMode, isSelectedForMerge, onSelect, onNavigate, mergedTableNumbers, orders = [] }: TableCardProps) {
  const currentStatus = (table.status as TableStatus) || "FREE";
  const isCleaning = currentStatus === "CLEANING";
  const isSelectable = mergeMode && (currentStatus === "OCCUPIED" || currentStatus === "FREE");

  // Filtrar pedidos activos para esta mesa
  const tableOrders = orders.filter(o => o.tableId === table.id && o.status !== 'COMPLETED' && o.status !== 'REJECTED');
  const itemsCount = tableOrders.reduce((sum, o) => sum + (o.order_items?.length || o.orderItems?.length || 0), 0);

  const handleClick = () => {
    if (isSelectable) onSelect(table.id);
    else if (!mergeMode) onNavigate(table.id);
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className={`relative group ${isSelectable ? "cursor-pointer" : ""}`}
      onClick={handleClick}
    >
      {isSelectable && (
        <div className={`absolute inset-0 z-10 rounded-[inherit] border-2 transition-all ${
          isSelectedForMerge ? "border-primary bg-primary/10" : "border-transparent hover:border-primary/40"
        }`} />
      )}
      {isSelectedForMerge && (
        <div className="absolute -top-2 -left-2 z-20 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/40">
          <CheckCircle className="w-3 h-3 text-primary-foreground" />
        </div>
      )}

      <div className="absolute -top-3 -right-3 z-20 flex flex-col gap-1.5 pointer-events-none">
        {isReady && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-emerald-500 text-black text-[8px] font-black px-2 py-1 rounded-lg shadow-lg animate-bounce">
            LISTO
          </motion.div>
        )}
        {isPreparing && !isReady && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-primary text-primary-foreground text-[8px] font-black px-2 py-1 rounded-lg shadow-lg">
            PREPARANDO
          </motion.div>
        )}
        {isBillRequested && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-yellow-500 text-black text-[8px] font-black px-2 py-1 rounded-lg shadow-lg">
            CUENTA
          </motion.div>
        )}
        {isCleaning && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-sky-400 text-black text-[8px] font-black px-2 py-1 rounded-lg shadow-lg">
            LIMPIAR
          </motion.div>
        )}
      </div>

      <div className={`relative bg-card border border-border/40 rounded-[2.5rem] sm:rounded-[3rem] p-5 sm:p-8 flex flex-col items-center justify-center gap-4 sm:gap-6 transition-all cursor-pointer hover:border-primary/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] ${
        isBillRequested ? "ring-2 ring-yellow-500/30 border-yellow-500/40" : 
        isReady ? "ring-2 ring-emerald-500/30 border-emerald-500/40" : 
        table.current_session_id ? "ring-2 ring-primary/40 border-primary/50 bg-primary/[0.02]" : "border-border/40"
      }`}>
        {table.current_session_id && (
          <div 
            className="absolute top-6 left-6 text-primary/60" 
            title={mergedTableNumbers && mergedTableNumbers.length > 0 
              ? `Fusionada con Mesa ${mergedTableNumbers.filter(n => n !== table.number).join(', ')}` 
              : "Mesa Fusionada"}
          >
            <Link2 className="w-5 h-5" />
          </div>
        )}
        <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-[1.25rem] sm:rounded-[2rem] flex items-center justify-center border transition-all ${STATUS_STYLES[currentStatus]}`}>
          <Hash className="w-7 h-7 sm:w-10 sm:h-10 font-black" />
        </div>
        <div className="text-center">
          <p className="text-2xl sm:text-3xl font-black tracking-tighter leading-none mb-1.5">{table.number}</p>
          <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${STATUS_TEXT[currentStatus]}`}>
            {currentStatus}
          </p>
          {itemsCount > 0 && (
            <p className="text-[8px] sm:text-[9px] font-bold text-muted-foreground mt-2 sm:mt-3 uppercase tracking-tight">
              {itemsCount} ítem(s) en curso
            </p>
          )}
          {mergedTableNumbers && mergedTableNumbers.length > 0 && (
            <p className="text-[9px] font-black text-primary mt-2 uppercase tracking-widest flex items-center gap-1.5 justify-center">
              <Link2 className="w-3.5 h-3.5" /> Con Mesas: {mergedTableNumbers.filter(n => n !== table.number).join(', ')}
            </p>
          )}
        </div>
        {isReady && <div className="absolute -inset-1 bg-emerald-500/10 rounded-[2.6rem] sm:rounded-[3.1rem] -z-10 animate-pulse" />}
        {isBillRequested && <div className="absolute -inset-1 bg-yellow-500/10 rounded-[2.6rem] sm:rounded-[3.1rem] -z-10 animate-pulse" />}
      </div>
    </motion.div>
  );
}

