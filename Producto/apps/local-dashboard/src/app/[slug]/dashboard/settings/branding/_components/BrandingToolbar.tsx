"use client";

import React from "react";
import { Button } from "@menu-bites/ui";
import { Save, Loader2, Pencil } from "lucide-react";

interface BrandingToolbarProps {
  customName: string;
  setCustomName: (name: string) => void;
  onApply: () => void;
  isSaving: boolean;
  isDirty: boolean;
}

export function BrandingToolbar({ customName, setCustomName, onApply, isSaving, isDirty }: BrandingToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 border-t border-foreground/5">
      <Button
        onClick={onApply}
        disabled={isSaving}
        className={`w-full h-14 px-10 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 relative ${
          isDirty
            ? "bg-yellow-500 hover:bg-yellow-400 text-black shadow-yellow-500/30"
            : "bg-primary hover:bg-primary/80 text-primary-foreground shadow-primary/40"
        }`}
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin mr-3" />
        ) : isDirty ? (
          <Pencil className="w-4 h-4 mr-3" />
        ) : (
          <Save className="w-4 h-4 mr-3" />
        )}
        {isSaving ? "Aplicando..." : isDirty ? "Guardar cambios" : "Aplicar Marca"}
      </Button>
    </div>
  );
}
