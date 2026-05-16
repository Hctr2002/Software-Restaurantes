"use client";

import React from "react";
import { Palette, Loader2, Pipette, Sparkles } from "lucide-react";
import { Button } from "@menu-bites/ui";
import { motion } from "framer-motion";

/**
 * Propiedades del módulo de Estética
 */
interface AestheticSettingsProps {
  theme: any;
  onPreview: (newTheme: any) => void;
  onSave: () => void;
  loading: boolean;
}

/**
 * AestheticSettings
 * 
 * Permite al SUPER_ADMIN personalizar la paleta de colores del panel administrativo.
 * Implementa una interfaz de "Laboratorio" con previsualización en tiempo real.
 */
export default function AestheticSettings({
  theme,
  onPreview,
  onSave,
  loading
}: AestheticSettingsProps) {
  return (
    <section className="relative group h-full">
      {/* Efecto de resplandor animado en el fondo */}
      <div className="absolute -inset-1 bg-gradient-to-tr from-accent/10 via-primary/5 to-transparent rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>

      <div className="relative bg-card border border-border rounded-[2.5rem] overflow-hidden h-full shadow-2xl flex flex-col">
        {/* Cabecera del Laboratorio Cromático */}
        <div className="p-8 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-2.5 bg-accent/10 rounded-2xl text-accent">
                  <Palette className="w-5 h-5" />
               </div>
               <div>
                  <h2 className="text-lg font-black text-foreground uppercase italic tracking-tight">Estética</h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Laboratorio Cromático Superior</p>
               </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border border-border">
               <Sparkles className="w-3 h-3 text-accent animate-pulse" />
               <span className="text-[9px] font-black uppercase text-accent tracking-tighter">Modo Pro-Max</span>
            </div>
          </div>
        </div>

        {/* Controles de Color */}
        <div className="p-8 space-y-8 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ColorField label="Primario (Marca)" value={theme.primaryColor} onChange={(c) => onPreview({...theme, primaryColor: c})} />
            <ColorField label="Fondo (Lienzo)" value={theme.backgroundColor} onChange={(c) => onPreview({...theme, backgroundColor: c})} />
            <ColorField label="Texto (Lectura)" value={theme.textColor} onChange={(c) => onPreview({...theme, textColor: c})} />
            <ColorField label="Acento (Detalle)" value={theme.accentColor} onChange={(c) => onPreview({...theme, accentColor: c})} />
            <ColorField label="Tarjetas (Glass)" value={theme.cardBackground} onChange={(c) => onPreview({...theme, cardBackground: c})} />
            <ColorField label="Secundario" value={theme.secondaryColor} onChange={(c) => onPreview({...theme, secondaryColor: c})} />
          </div>

          {/* Botón de Aplicación de Estilo */}
          <div className="pt-8 mt-auto">
            <Button 
              onClick={onSave} 
              disabled={loading}
              className="w-full h-14 bg-muted/50 hover:bg-accent hover:text-accent-foreground border border-border text-xs font-black uppercase italic tracking-widest rounded-2xl transition-all shadow-xl hover:shadow-accent/20 active:scale-[0.98] group/save"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Pipette className="w-5 h-5 mr-2 transition-transform group-hover/save:scale-110" />
              )}
              Fijar Configuración Visual
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Sub-componente: ColorField
 * Campo individual para la selección de color con visualización de código Hex.
 */
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) {
  return (
    <div className="space-y-3 group/field">
      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 group-hover/field:text-accent transition-colors flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-accent/20 group-hover/field:bg-accent transition-colors"></span>
        {label}
      </label>
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12">
          <input 
            type="color" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div 
            className="w-full h-full rounded-2xl border-2 border-foreground/10 shadow-inner group-hover/field:scale-105 transition-transform"
            style={{ backgroundColor: value }}
          />
        </div>
        <div className="flex-1 h-12 bg-muted/30 border border-border rounded-2xl flex items-center px-4 font-mono text-xs font-bold text-foreground/70 group-hover/field:border-accent/30 transition-colors">
          {value.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
