"use client";

import { CheckCircle, Hash } from "lucide-react";
import { motion } from "framer-motion";

type TableStatus = "FREE" | "OCCUPIED" | "CLEANING";

interface Table {
  id: string;
  number: number;
  status: TableStatus;
  bill_requested?: boolean;
}

interface Props {
  table: Table;
  isBillRequested: boolean;
  isReady: boolean;
  mergeMode: boolean;
  isSelectedForMerge: boolean;
  onSelect: (id: string) => void;
  onNavigate: (id: string) => void;
}

const STATUS_STYLES: Record<TableStatus, string> = {
  FREE:     "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  OCCUPIED: "bg-primary/10 border-primary/20 text-primary",
  CLEANING: "bg-sky-500/10 border-sky-500/20 text-sky-400",
};

const STATUS_TEXT: Record<TableStatus, string> = {
  FREE:     "text-emerald-400",
  OCCUPIED: "text-primary",
  CLEANING: "text-sky-400",
};

export function TableCard({ table, isBillRequested, isReady, mergeMode, isSelectedForMerge, onSelect, onNavigate }: Props) {
  const isCleaning = table.status === "CLEANING";
  const isSelectable = mergeMode && table.status === "OCCUPIED";

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

      <div className={`relative bg-card/40 border border-white/5 rounded-[2.5rem] p-6 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer hover:bg-card/60 hover:border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${
        isBillRequested ? "ring-2 ring-yellow-500/30" : ""
      } ${isReady ? "ring-2 ring-emerald-500/30" : ""}`}>
        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border transition-all ${STATUS_STYLES[table.status]}`}>
          <Hash className="w-8 h-8 font-black" />
        </div>
        <div className="text-center">
          <p className="text-2xl font-black tracking-tighter leading-none mb-1">{table.number}</p>
          <p className={`text-[9px] font-black uppercase tracking-widest ${STATUS_TEXT[table.status]}`}>
            {table.status}
          </p>
        </div>
        {isReady && <div className="absolute -inset-0.5 bg-emerald-500/20 rounded-[2.6rem] blur animate-pulse -z-10" />}
        {isBillRequested && <div className="absolute -inset-0.5 bg-yellow-500/20 rounded-[2.6rem] blur animate-pulse -z-10" />}
      </div>
    </motion.div>
  );
}
