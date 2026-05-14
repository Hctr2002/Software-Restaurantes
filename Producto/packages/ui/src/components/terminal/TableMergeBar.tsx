"use client";

import React from "react";
import { Button } from "../ui/button";
import { CheckCircle, Link2, Link2Off, Loader2 } from "lucide-react";

interface TableMergeBarProps {
  mergeMode: boolean;
  selectedCount: number;
  merging: boolean;
  mergeResult: string | null;
  onToggleMode: () => void;
  onConfirmMerge: () => void;
  onConfirmUnlink?: () => void;
  canUnlink?: boolean;
}

export function TableMergeBar({
  mergeMode, selectedCount, merging, mergeResult,
  onToggleMode, onConfirmMerge, onConfirmUnlink, canUnlink,
}: TableMergeBarProps) {
  return (
    <>
      {mergeResult && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {mergeResult}
        </div>
      )}

      {mergeMode && selectedCount >= 2 && (
        <button
          onClick={onConfirmMerge}
          disabled={merging}
          className="w-full relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:pointer-events-none group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
          {merging ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5 drop-shadow-md" />}
          Fusionar {selectedCount} mesas seleccionadas
        </button>
      )}

      {mergeMode && canUnlink && selectedCount === 1 && (
        <button
          onClick={onConfirmUnlink}
          disabled={merging}
          className="w-full relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:pointer-events-none group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
          {merging ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2Off className="w-5 h-5 drop-shadow-md" />}
          Desvincular mesa seleccionada
        </button>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={onToggleMode}
        title={mergeMode ? "Cancelar fusión" : "Fusionar mesas"}
        className={`rounded-xl w-11 h-11 shrink-0 transition-all ${
          mergeMode ? "border-primary/40 text-primary bg-primary/10" : "border-foreground/20 bg-foreground/5 text-foreground/60 hover:bg-foreground/10 hover:text-foreground"
        }`}
      >
        {mergeMode ? <Link2Off className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
      </Button>
    </>
  );
}
