"use client";

import React from "react";
import LocalShell from "../../_components/LocalShell";
import { Loader2 } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";

// Sub-componentes modularizados
import InspirationCarousel from "./_components/InspirationCarousel";
import DesignTabs from "./_components/DesignTabs";
import LivePreview from "./_components/LivePreview";
import BrandingToolbar from "./_components/BrandingToolbar";

/**
 * BrandingPage - Orquestador del Laboratorio de Marca
 * 
 * Este componente es el cerebro de la configuración visual del restaurante.
 * Coordina la carga de temas desde Supabase, la previsualización en vivo 
 * y la persistencia de cambios estéticos mediante el hook useBranding.
 */
export default function BrandingPage() {
  const {
    slug,
    currentTheme,
    setCurrentTheme,
    isSaving,
    customName,
    setCustomName,
    isLoading,
    sampleProduct,
    activeTab,
    setActiveTab,
    handleSaveTheme,
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

  return (
    <LocalShell title="Configuración" subtitle="Branding & Identidad">
      <div className="space-y-12 pb-20">
        
        {/* Componente Modular: Carrusel de Presets */}
        <InspirationCarousel 
          currentTheme={currentTheme} 
          onSelectTheme={setCurrentTheme} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Columna Izquierda: Panel de Control Dinámico */}
          <div className="lg:col-span-7 space-y-8">
            <DesignTabs 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              currentTheme={currentTheme}
              setCurrentTheme={setCurrentTheme}
              slug={slug}
            />

            {/* Barra de Acciones Globales (Modularizada) */}
            <BrandingToolbar 
              customName={customName}
              setCustomName={setCustomName}
              onSave={handleSaveTheme}
              isSaving={isSaving}
            />
          </div>

          {/* Columna Derecha: Previsualización de Alta Fidelidad */}
          <div className="lg:col-span-5 relative">
            <LivePreview 
              currentTheme={currentTheme} 
              sampleProduct={sampleProduct} 
            />
          </div>
        </div>
      </div>
    </LocalShell>
  );
}
