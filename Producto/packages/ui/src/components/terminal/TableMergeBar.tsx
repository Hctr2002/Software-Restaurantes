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
}

export function TableMergeBar({
  mergeMode, selectedCount, merging, mergeResult,
  onToggleMode, onConfirmMerge,
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
        <Button
          onClick={onConfirmMerge}
          disabled={merging}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-primary/20"
        >
          {merging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
          Fusionar {selectedCount} mesas seleccionadas
        </Button>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={onToggleMode}
        title={mergeMode ? "Cancelar fusión" : "Fusionar mesas"}
        className={`rounded-xl w-11 h-11 shrink-0 transition-all ${
          mergeMode ? "border-primary/40 text-primary bg-primary/10" : "border-border/20"
        }`}
      >
        {mergeMode ? <Link2Off className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
      </Button>
    </>
  );
}
