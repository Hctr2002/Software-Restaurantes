"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import LocalShell from "../../_components/LocalShell";
import { Button, Input } from "@menu-bites/ui";
import { PALETTE_TEMPLATES } from "@/lib/constants/palettes";
import { Save, Plus, Loader2 } from "lucide-react";
import { loadGoogleFonts } from "./_components/utils";

// Importación de sub-componentes modularizados
import InspirationCarousel from "./_components/InspirationCarousel";
import DesignTabs from "./_components/DesignTabs";
import LivePreview from "./_components/LivePreview";

/**
 * BrandingPage - Orquestador del Laboratorio de Marca
 * 
 * Este componente es el cerebro de la configuración visual del restaurante.
 * Coordina la carga de temas desde Supabase, la previsualización en vivo 
 * y la persistencia de cambios estéticos.
 */
export default function BrandingPage() {
  const params = useParams();
  const slug = params?.slug as string;

  // Estados de Temas y Visualización
  const [themes, setThemes] = useState<any[]>([]);
  const [activeTheme, setActiveTheme] = useState<any>(null);
  const [currentTheme, setCurrentTheme] = useState<any>(PALETTE_TEMPLATES[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [customName, setCustomName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sampleProduct, setSampleProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"style" | "fonts" | "business">("style");

  // Efectos de inicialización
  useEffect(() => {
    fetchThemes();
    fetchSampleProduct();
  }, [slug]);

  /**
   * Obtiene los temas guardados del restaurante desde la base de datos.
   */
  const fetchThemes = async () => {
    try {
      const res = await fetch("/api/local/theme");
      const { data } = await res.json();
      setThemes(data || []);
      
      const active = data?.find((t: any) => t.is_active);
      if (active) {
        setActiveTheme(active);
        setCurrentTheme({
          primaryColor: active.primary_color,
          secondaryColor: active.secondary_color,
          backgroundColor: active.background_color,
          accentColor: active.accent_color,
          textColor: active.text_color,
          cardBackground: active.card_background,
          fontTitle: active.font_title,
          fontBody: active.font_body,
          fontAccent: active.font_accent || active.font_title,
          paletteName: active.palette_name,
          logoUrl: active.logo_url
        });
      }
    } catch (error) {
      console.error("Error al obtener temas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Obtiene un producto de ejemplo para el simulador live.
   */
  const fetchSampleProduct = async () => {
    try {
      const res = await fetch("/api/local/menu");
      const { data } = await res.json();
      if (data && data.length > 0) {
        setSampleProduct(data[0]);
      }
    } catch (e) {
      console.error("Error al obtener producto de ejemplo:", e);
    }
  };

  // Sincronización de fuentes dinámicas al cambiar la selección
  useEffect(() => {
    loadGoogleFonts(currentTheme.fontTitle, currentTheme.fontBody, currentTheme.fontAccent);
  }, [currentTheme.fontTitle, currentTheme.fontBody, currentTheme.fontAccent]);

  /**
   * Persiste el diseño actual en la base de datos de Supabase.
   * @param isNew - Si se debe crear un nuevo registro o actualizar el actual.
   */
  const handleSaveTheme = async (isNew = false) => {
    setIsSaving(true);
    try {
      const payload = {
        name: isNew ? customName : (currentTheme.name || "Tema Personalizado"),
        paletteName: currentTheme.id || currentTheme.paletteName,
        isCustom: isNew,
        isActive: true,
        primaryColor: currentTheme.primaryColor,
        secondaryColor: currentTheme.secondaryColor,
        backgroundColor: currentTheme.backgroundColor,
        accentColor: currentTheme.accentColor,
        textColor: currentTheme.textColor,
        cardBackground: currentTheme.cardBackground,
        fontTitle: currentTheme.fontTitle || "Outfit",
        fontBody: currentTheme.fontBody || "Inter",
        fontAccent: currentTheme.fontAccent || "Outfit",
        logoUrl: currentTheme.logoUrl
      };

      const res = await fetch("/api/local/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setCustomName("");
        await fetchThemes();
        // Notificamos al sistema del cambio global de tema
        window.dispatchEvent(new Event("theme-updated"));
      }
    } catch (error) {
      console.error("Error al guardar marca:", error);
    } finally {
      setIsSaving(false);
    }
  };

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

            {/* Barra de Acciones Globales */}
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
                   onClick={() => handleSaveTheme(true)}
                   className="absolute right-2 top-2 h-10 px-4 text-[9px] font-black uppercase tracking-widest hover:bg-primary/20 hover:text-primary rounded-xl"
                >
                   <Plus className="w-3 h-3 mr-1.5" /> Guardar Nuevo
                </Button>
              </div>
              <Button
                onClick={() => handleSaveTheme(false)}
                disabled={isSaving}
                className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-primary hover:bg-primary/80 text-primary-foreground text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 transition-all active:scale-95"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Save className="w-4 h-4 mr-3" />}
                {isSaving ? "Aplicando..." : "Aplicar Marca"}
              </Button>
            </div>
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
