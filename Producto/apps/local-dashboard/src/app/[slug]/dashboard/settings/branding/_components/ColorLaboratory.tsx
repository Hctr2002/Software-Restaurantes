"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card } from "@menu-bites/ui";

interface ColorLaboratoryProps {
  currentTheme: any;
  setCurrentTheme: (theme: any) => void;
}

export default function ColorLaboratory({ currentTheme, setCurrentTheme }: ColorLaboratoryProps) {
  const updateColor = (key: string, color: string) => {
    setCurrentTheme({ ...currentTheme, [key]: color, paletteName: 'custom' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: 20 }}
      className="space-y-8"
    >
      <Card className="p-8 bg-foreground/5 border-foreground/5 rounded-[2.5rem] shadow-2xl space-y-10">
        <div>
          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Laboratorio de Color</h3>
          <p className="text-xs text-foreground/40 font-medium">Ajusta cada matiz de la experiencia visual</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <ColorInput label="Primario" value={currentTheme.primaryColor} onChange={(c) => updateColor('primaryColor', c)} />
          <ColorInput label="Fondo" value={currentTheme.backgroundColor} onChange={(c) => updateColor('backgroundColor', c)} />
          <ColorInput label="Texto" value={currentTheme.textColor} onChange={(c) => updateColor('textColor', c)} />
          <ColorInput label="Acento" value={currentTheme.accentColor} onChange={(c) => updateColor('accentColor', c)} />
          <ColorInput label="Tarjetas" value={currentTheme.cardBackground} onChange={(c) => updateColor('cardBackground', c)} />
          <ColorInput label="Secundario" value={currentTheme.secondaryColor} onChange={(c) => updateColor('secondaryColor', c)} />
        </div>
      </Card>
    </motion.div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) {
  return (
    <div className="space-y-3 group">
      <label className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em] px-1 group-hover:text-primary transition-colors">
        {label}
      </label>
      <div className="relative flex items-center">
        <input 
          type="color" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded-2xl border-none p-0 bg-transparent cursor-pointer overflow-hidden shadow-xl"
        />
        <div className="ml-3 flex-1 h-12 bg-foreground/5 border border-foreground/10 rounded-2xl flex items-center px-4 font-mono text-[10px] font-bold text-foreground/60">
          {value.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
