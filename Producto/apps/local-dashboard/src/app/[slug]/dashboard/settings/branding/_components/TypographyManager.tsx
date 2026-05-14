"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card } from "@menu-bites/ui";
import { TITLE_FONTS, BODY_FONTS, ACCENT_FONTS } from "./constants";

interface TypographyManagerProps {
  currentTheme: any;
  setCurrentTheme: (theme: any) => void;
}

/**
 * TypographyManager
 * 
 * Gestiona la selección de fuentes para títulos, cuerpo y acentos.
 */
export function TypographyManager({ currentTheme, setCurrentTheme }: TypographyManagerProps) {
  const updateFont = (key: string, font: string) => {
    setCurrentTheme({ ...currentTheme, [key]: font });
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
          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Jerarquía Tipográfica</h3>
          <p className="text-xs text-foreground/40 font-medium">Define la voz visual de tu restaurante</p>
        </div>
        
        <div className="space-y-8">
          <FontSelector 
            label="Títulos & Categorías" 
            value={currentTheme.fontTitle} 
            options={TITLE_FONTS} 
            onChange={(f) => updateFont('fontTitle', f)} 
          />
          <FontSelector 
            label="Cuerpo & Lectura" 
            value={currentTheme.fontBody} 
            options={BODY_FONTS} 
            onChange={(f) => updateFont('fontBody', f)} 
          />
          <FontSelector 
            label="Navegación & Precios" 
            value={currentTheme.fontAccent} 
            options={ACCENT_FONTS} 
            onChange={(f) => updateFont('fontAccent', f)} 
          />
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * Sub-componente: FontSelector
 */
function FontSelector({ 
  label, 
  value, 
  options, 
  onChange 
}: { 
  label: string; 
  value: string; 
  options: any[]; 
  onChange: (f: string) => void 
}) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest flex items-center gap-2 px-1">
        <div className="w-1 h-4 bg-primary/40 rounded-full" /> {label}
      </label>
      <select
        value={value || "Outfit"}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-foreground/5 border border-foreground/10 rounded-[1.5rem] h-14 px-6 text-sm text-foreground font-bold outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer hover:bg-foreground/10 transition-all"
        style={{ fontFamily: `"${value || 'Outfit'}", sans-serif` }}
      >
        {options.map(f => (
          <option key={f.value} value={f.value} className="bg-background text-foreground">{f.label}</option>
        ))}
      </select>
    </div>
  );
}
