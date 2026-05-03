"use client";

import React from "react";
import { Palette, Loader2 } from "lucide-react";
import { Button } from "@menu-bites/ui";

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
 * Incluye controles granulares y una acción directa para aplicar los cambios globalmente.
 */
export default function AestheticSettings({
  theme,
  onPreview,
  onSave,
  loading
}: AestheticSettingsProps) {
  return (
    <section className="space-y-8">
      <div className="glass-premium rounded-[2.5rem] overflow-hidden h-full shadow-2xl">
        {/* Cabecera del Laboratorio Cromático */}
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
                <Palette className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-lg font-black text-white uppercase italic tracking-tight">Estética del Panel</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Laboratorio Cromático Superior</p>
             </div>
          </div>
        </div>

        {/* Controles de Color */}
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <ColorField label="Primario" value={theme.primaryColor} onChange={(c) => onPreview({...theme, primaryColor: c})} />
            <ColorField label="Fondo" value={theme.backgroundColor} onChange={(c) => onPreview({...theme, backgroundColor: c})} />
            <ColorField label="Texto" value={theme.textColor} onChange={(c) => onPreview({...theme, textColor: c})} />
            <ColorField label="Acento" value={theme.accentColor} onChange={(c) => onPreview({...theme, accentColor: c})} />
            <ColorField label="Tarjetas" value={theme.cardBackground} onChange={(c) => onPreview({...theme, cardBackground: c})} />
            <ColorField label="Secundario" value={theme.secondaryColor} onChange={(c) => onPreview({...theme, secondaryColor: c})} />
          </div>

          {/* Botón de Aplicación de Estilo */}
          <div className="pt-6 border-t border-white/5">
            <Button 
              onClick={onSave} 
              disabled={loading}
              className="w-full h-12 bg-white/5 hover:bg-primary hover:text-white border-white/10 text-[10px] font-black uppercase italic tracking-widest rounded-2xl transition-all shadow-xl hover:shadow-primary/20 active:scale-95"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Palette className="w-4 h-4 mr-2" />}
              Aplicar Paleta al Panel
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
    <div className="space-y-2 group">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 group-hover:text-primary transition-colors">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input 
          type="color" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-xl bg-transparent border-none cursor-pointer shadow-lg"
        />
        <div className="flex-1 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center px-4 font-mono text-[10px] font-bold text-slate-400">
          {value.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
