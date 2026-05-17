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
  isAlreadyMerged?: boolean;
}

export function TableMergeBar({
  mergeMode, selectedCount, merging, mergeResult,
  onToggleMode, onConfirmMerge, onConfirmUnlink, canUnlink, isAlreadyMerged,
}: TableMergeBarProps) {
  return (
    <>
      {mergeResult && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-success/10 border border-success/30 text-success text-xs font-black shadow-lg shadow-success/5">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {mergeResult}
        </div>
      )}

      {mergeMode && selectedCount >= 2 && (
        <button
          onClick={onConfirmMerge}
          disabled={merging || isAlreadyMerged}
          className={`w-full relative flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-[0.98] disabled:pointer-events-none group overflow-hidden ${
            isAlreadyMerged
              ? "bg-destructive text-destructive-foreground shadow-destructive/30"
              : "bg-primary text-primary-foreground shadow-primary/30 hover:bg-primary/90 disabled:opacity-50"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
          {merging ? <Loader2 className="w-5 h-5 animate-spin" /> : (isAlreadyMerged ? <Link2Off className="w-5 h-5" /> : <Link2 className="w-5 h-5" />)}
          {isAlreadyMerged ? "Mesas ya fusionadas" : `Fusionar ${selectedCount} mesas seleccionadas`}
        </button>
      )}

      {mergeMode && canUnlink && selectedCount === 1 && (
        <button
          onClick={onConfirmUnlink}
          disabled={merging}
          className="w-full relative flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] bg-destructive text-destructive-foreground font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-destructive/30 transition-all hover:bg-destructive/90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
          {merging ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2Off className="w-5 h-5" />}
          Desvincular mesa seleccionada
        </button>
      )}
    </>
  );
}
