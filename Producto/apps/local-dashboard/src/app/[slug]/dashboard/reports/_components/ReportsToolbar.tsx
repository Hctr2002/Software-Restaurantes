/**
 * ReportsToolbar — Barra de filtros del módulo de reportes.
 * Permite seleccionar presets de período o configurar un rango personalizado y exportar a Excel.
 */
"use client";

import { Filter, Download } from "lucide-react";
import { Button } from "@menu-bites/ui";
import { motion } from "framer-motion";
import { todayISO } from "@/lib/reportUtils";

interface ReportsToolbarProps {
  presets: readonly { label: string; days: number }[];
  preset: number;
  isCustom: boolean;
  dateFrom: string;
  dateTo: string;
  loading: boolean;
  onPresetChange: (days: number) => void;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  onApplyCustom: () => void;
  onExport: () => void;
}

export default function ReportsToolbar({
  presets,
  preset,
  isCustom,
  dateFrom,
  dateTo,
  loading,
  onPresetChange,
  onDateFromChange,
  onDateToChange,
  onApplyCustom,
  onExport,
}: ReportsToolbarProps) {
  return (
    <div className="glass p-6 rounded-[2.5rem] border-foreground/5 mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
          <Filter className="w-3 h-3" /> Filtrar Período
        </p>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.days}
              onClick={() => onPresetChange(p.days)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                (p.days === 0 ? isCustom : !isCustom && preset === p.days)
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-foreground/5 text-foreground/40 hover:bg-foreground/10 hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isCustom && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-wrap items-end gap-3 glass p-4 rounded-2xl border-foreground/5">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-foreground/30 uppercase tracking-widest px-1">Desde</label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || todayISO()}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="h-10 px-3 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-foreground/30 uppercase tracking-widest px-1">Hasta</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              max={todayISO()}
              onChange={(e) => onDateToChange(e.target.value)}
              className="h-10 px-3 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <Button
            onClick={onApplyCustom}
            disabled={!dateFrom || !dateTo || dateFrom > dateTo}
            className="bg-primary hover:bg-primary/80 text-primary-foreground h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest"
          >
            Aplicar
          </Button>
        </motion.div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={onExport}
          disabled={loading}
          variant="ghost"
          className="h-11 px-6 rounded-2xl bg-foreground/5 border border-foreground/5 hover:bg-primary/10 hover:text-primary transition-all group font-bold uppercase tracking-widest text-[10px]"
        >
          <Download className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
          Descargar Excel
        </Button>
      </div>
    </div>
  );
}
