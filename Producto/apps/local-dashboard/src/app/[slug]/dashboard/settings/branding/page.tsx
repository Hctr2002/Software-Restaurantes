"use client";

import React from "react";
import LocalShell from "../../_components/LocalShell";
import { Loader2, Save, Plus, AlertTriangle } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";

import { InspirationCarousel } from "./_components/InspirationCarousel";
import SavedThemes from "./_components/SavedThemes";
import { DesignTabs } from "./_components/DesignTabs";
import { LivePreview } from "./_components/LivePreview";
import { BrandingToolbar } from "./_components/BrandingToolbar";

export default function BrandingPage() {
  const {
    slug,
    themes,
    activeTheme,
    currentTheme,
    selectCarouselTheme,
    editCurrentTheme,
    isDirty,
    originThemeId,
    originThemeName,
    saveModalMode,
    setSaveModalMode,
    isSaving,
    customName,
    setCustomName,
    isLoading,
    sampleProduct,
    activeTab,
    setActiveTab,
    handleApply,
    handleUpdateTheme,
    handleSaveAsNew,
    handleDeleteTheme,
    handleDeleteThemes,
    handleActivateTheme,
  } = useBranding();

  if (isLoading) {
    return (
      <LocalShell title="Branding" subtitle="Cargando Laboratorio...">
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </LocalShell>
    );
  }

  // Solo temas personalizados aparecen en SavedThemes
  const customThemes = themes.filter((t) => t.is_custom);

  return (
    <LocalShell title="Configuración" subtitle="Branding & Identidad">
      <div className="space-y-12 pb-20">

        <InspirationCarousel
          currentTheme={currentTheme}
          onSelectTheme={selectCarouselTheme}
        />

        <SavedThemes
          themes={customThemes}
          activeThemeId={activeTheme?.id}
          onDelete={handleDeleteTheme}
          onDeleteMany={handleDeleteThemes}
          onActivate={handleActivateTheme}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 space-y-8">
            <DesignTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              currentTheme={currentTheme}
              setCurrentTheme={editCurrentTheme}
              slug={slug}
            />

            <BrandingToolbar
              customName={customName}
              setCustomName={setCustomName}
              onApply={handleApply}
              isSaving={isSaving}
              isDirty={isDirty}
            />
          </div>

          <div className="lg:col-span-5 relative">
            <LivePreview currentTheme={currentTheme} sampleProduct={sampleProduct} />
          </div>
        </div>
      </div>

      {/* Modal de guardado */}
      {saveModalMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-background/80"
            onClick={() => setSaveModalMode(null)}
          />
          <div className="relative w-full max-w-sm bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-yellow-500/10 rounded-[1.5rem] flex items-center justify-center border border-yellow-500/20 mx-auto">
              <AlertTriangle className="w-7 h-7 text-yellow-500" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-xl font-black tracking-tighter">
                {saveModalMode === "update-or-new"
                  ? "Cambios sin guardar"
                  : "Guarda el diseño primero"}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {saveModalMode === "update-or-new"
                  ? `Modificaste "${originThemeName}". ¿Deseas actualizar ese tema o guardarlo como uno nuevo?`
                  : "Este diseño aún no está guardado. Ponle un nombre para aplicarlo."}
              </p>
            </div>

            {/* Input de nombre — siempre visible para dar nombre */}
            <input
              type="text"
              placeholder="Nombre del tema..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl bg-card border border-border text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-primary/30"
            />

            <div className="space-y-3 pt-2">
              {saveModalMode === "update-or-new" && (
                <button
                  onClick={handleUpdateTheme}
                  disabled={isSaving}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-[0.15em] rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar cambios en "{originThemeName}"
                </button>
              )}

              <button
                onClick={handleSaveAsNew}
                disabled={isSaving || !customName.trim()}
                className="w-full h-12 bg-foreground/10 hover:bg-foreground/20 text-foreground font-black uppercase text-[10px] tracking-[0.15em] rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Guardar como tema nuevo
              </button>

              <button
                onClick={() => setSaveModalMode(null)}
                disabled={isSaving}
                className="w-full py-3 text-[10px] text-muted-foreground font-black uppercase tracking-widest hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </LocalShell>
  );
}
