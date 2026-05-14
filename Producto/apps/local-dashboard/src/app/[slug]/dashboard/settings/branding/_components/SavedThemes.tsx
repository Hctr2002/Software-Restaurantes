"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Check, Layout, Bookmark } from "lucide-react";

interface SavedThemesProps {
  themes: any[];
  activeThemeId?: string;
  onDelete: (id: string) => void;
  onActivate: (id: string) => void;
}

/**
 * SavedThemes - Gestión de temas guardados con estética de alta fidelidad.
 */
export default function SavedThemes({ themes, activeThemeId, onDelete, onActivate }: SavedThemesProps) {
  if (themes.length === 0) return null;

  return (
    <section className="space-y-6 pt-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-2xl">
            <Bookmark className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground uppercase italic tracking-tight">Temas Guardados</h2>
            <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Tus diseños personalizados</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
        <AnimatePresence mode="popLayout">
          {themes.map((theme) => (
            <motion.div
              key={theme.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`group relative overflow-hidden rounded-[2.5rem] border transition-all duration-500 ${
                theme.id === activeThemeId 
                  ? "bg-white/10 border-primary/50 shadow-2xl shadow-primary/10" 
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              {/* Previsualización Miniatura */}
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                      {theme.name || "Sin nombre"}
                    </h3>
                    <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-[0.15em]">
                      {theme.is_custom ? "Personalizado" : "Base Template"}
                    </p>
                  </div>
                  
                  {theme.id === activeThemeId && (
                    <div className="p-1.5 bg-primary rounded-full">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Muestras de Color */}
                <div className="flex gap-2">
                  {[theme.primary_color, theme.secondary_color, theme.background_color].map((c, i) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-2xl border border-black/10 shadow-sm" 
                      style={{ backgroundColor: c }} 
                    />
                  ))}
                </div>

                {/* Acciones */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => onActivate(theme.id)}
                    disabled={theme.id === activeThemeId}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      theme.id === activeThemeId
                        ? "bg-primary/20 text-primary cursor-default"
                        : "bg-white/5 text-foreground/60 hover:bg-primary hover:text-primary-foreground"
                    }`}
                  >
                    <Layout className="w-3 h-3" />
                    {theme.id === activeThemeId ? "Activo" : "Activar"}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm("¿Estás seguro de eliminar este tema? Esta acción no se puede deshacer.")) {
                        onDelete(theme.id);
                      }
                    }}
                    className="p-2.5 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                    title="Eliminar Tema"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Efecto de Fondo */}
              <div 
                className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 transition-opacity group-hover:opacity-40" 
                style={{ backgroundColor: theme.primary_color }} 
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
