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
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-black shadow-lg shadow-emerald-500/5">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {mergeResult}
        </div>
      )}

      {mergeMode && selectedCount >= 2 && (
        <button
          onClick={onConfirmMerge}
          disabled={merging}
          className="w-full relative flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] bg-primary text-primary-foreground font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
          {merging ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5" />}
          Fusionar {selectedCount} mesas seleccionadas
        </button>
      )}

      {mergeMode && canUnlink && selectedCount === 1 && (
        <button
          onClick={onConfirmUnlink}
          disabled={merging}
          className="w-full relative flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] bg-red-600 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-red-500/30 transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
          {merging ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2Off className="w-5 h-5" />}
          Desvincular mesa seleccionada
        </button>
      )}
    </>
  );
}
