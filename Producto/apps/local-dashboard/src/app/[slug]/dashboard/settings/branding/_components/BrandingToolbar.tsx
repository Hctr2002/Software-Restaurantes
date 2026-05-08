"use client";

import React from "react";
import { Button, Input } from "@menu-bites/ui";
import { Save, Plus, Loader2 } from "lucide-react";

interface BrandingToolbarProps {
  customName: string;
  setCustomName: (name: string) => void;
  onSave: (isNew?: boolean) => void;
  isSaving: boolean;
}

export default function BrandingToolbar({
  customName,
  setCustomName,
  onSave,
  isSaving
}: BrandingToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 border-t border-white/5">
      <div className="flex-1 w-full relative group">
        <Input 
          placeholder="Nombre para guardar este diseño..." 
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          className="h-14 bg-white/5 border-white/5 focus:border-primary/30 rounded-2xl px-6 text-xs font-bold uppercase tracking-widest transition-all"
        />
        <Button 
          size="sm"
          variant="ghost"
          onClick={() => onSave(true)}
          disabled={isSaving}
          className="absolute right-2 top-2 h-10 px-4 text-[9px] font-black uppercase tracking-widest hover:bg-primary/20 hover:text-primary rounded-xl"
        >
          <Plus className="w-3 h-3 mr-1.5" /> Guardar Nuevo
        </Button>
      </div>
      <Button
        onClick={() => onSave(false)}
        disabled={isSaving}
        className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-primary hover:bg-primary/80 text-primary-foreground text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 transition-all active:scale-95"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Save className="w-4 h-4 mr-3" />}
        {isSaving ? "Aplicando..." : "Aplicar Marca"}
      </Button>
    </div>
  );
}
