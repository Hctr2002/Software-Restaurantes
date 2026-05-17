/**
 * SavedThemes — Galería de temas personalizados guardados en la base de datos.
 * Soporta selección múltiple para eliminación en batch, activación individual y confirmación de borrado.
 */
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Check, Layout, Bookmark, CheckSquare, Square, X } from "lucide-react";

interface SavedThemesProps {
  themes: any[];
  activeThemeId?: string;
  onDelete: (id: string) => void;
  onDeleteMany: (ids: string[]) => Promise<boolean>;
  onActivate: (id: string) => void;
}

export default function SavedThemes({ themes, activeThemeId, onDelete, onDeleteMany, onActivate }: SavedThemesProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  if (themes.length === 0) return null;

  const selectableThemes = themes.filter((t) => t.id !== activeThemeId);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === selectableThemes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableThemes.map((t) => t.id)));
    }
  };

  const exitSelecting = () => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    await onDeleteMany(Array.from(selectedIds));
    setIsDeleting(false);
    exitSelecting();
  };

  const allSelected = selectableThemes.length > 0 && selectedIds.size === selectableThemes.length;

  return (
    <section className="space-y-6 pt-4">
      {/* Header */}
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

        <div className="flex items-center gap-2">
          {isSelecting ? (
            <>
              {selectableThemes.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest bg-white/5 text-foreground/60 hover:bg-white/10 transition-all"
                >
                  {allSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  {allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
                </button>
              )}
              <button
                onClick={exitSelecting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest bg-white/5 text-foreground/60 hover:bg-white/10 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsSelecting(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest bg-white/5 text-foreground/50 hover:bg-white/10 transition-all"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Seleccionar
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
        <AnimatePresence mode="popLayout">
          {themes.map((theme) => {
            const isActive = theme.id === activeThemeId;
            const isSelected = selectedIds.has(theme.id);
            const isSelectable = isSelecting && !isActive;

            return (
              <motion.div
                key={theme.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                onClick={() => isSelectable && toggleSelect(theme.id)}
                className={`group relative overflow-hidden rounded-[2.5rem] border transition-all duration-300 ${
                  isActive
                    ? "bg-card border-primary shadow-2xl shadow-primary/10"
                    : isSelected
                    ? "bg-destructive/5 border-destructive shadow-lg shadow-destructive/10"
                    : "bg-card border-border hover:border-primary/30"
                } ${isSelectable ? "cursor-pointer" : ""}`}
              >
                {/* Checkbox de selección */}
                {isSelecting && (
                  <div className="absolute top-4 left-4 z-10">
                    {isActive ? (
                      <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center" title="Tema activo — no se puede eliminar">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                    ) : (
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        isSelected ? "bg-red-500 border-red-500" : "bg-white/10 border-white/30"
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    )}
                  </div>
                )}

                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={`space-y-1 ${isSelecting ? "ml-7" : ""}`}>
                      <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                        {theme.name || "Sin nombre"}
                      </h3>
                      <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-[0.15em]">
                        {theme.is_custom ? "Personalizado" : "Base Template"}
                      </p>
                    </div>

                    {isActive && !isSelecting && (
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

                  {/* Acciones (solo visibles fuera de modo selección) */}
                  {!isSelecting && (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => onActivate(theme.id)}
                        disabled={isActive}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                          isActive
                            ? "bg-primary/20 text-primary cursor-default"
                            : "bg-white/5 text-foreground/60 hover:bg-primary hover:text-primary-foreground"
                        }`}
                      >
                        <Layout className="w-3 h-3" />
                        {isActive ? "Activo" : "Activar"}
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
                  )}
                </div>

                {/* Efecto de Fondo */}
                <div
                  className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 transition-opacity group-hover:opacity-40"
                  style={{ backgroundColor: theme.primary_color }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Barra de acción flotante al seleccionar */}
      <AnimatePresence>
        {isSelecting && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 bg-card border border-border rounded-[2rem] shadow-2xl"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">
              {selectedIds.size} {selectedIds.size === 1 ? "tema seleccionado" : "temas seleccionados"}
            </span>
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-60"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? "Eliminando..." : `Eliminar ${selectedIds.size}`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
