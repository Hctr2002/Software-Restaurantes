"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PALETTE_TEMPLATES } from "@/lib/constants/palettes";
import { loadGoogleFonts } from "@/lib/brandingUtils";

export function useBranding() {
  const params = useParams();
  const slug = params?.slug as string;

  // Estados
  const [themes, setThemes] = useState<any[]>([]);
  const [activeTheme, setActiveTheme] = useState<any>(null);
  const [currentTheme, setCurrentTheme] = useState<any>(PALETTE_TEMPLATES[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [customName, setCustomName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sampleProduct, setSampleProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"style" | "fonts" | "business">("style");

  /**
   * Obtiene los temas guardados del restaurante
   */
  const fetchThemes = useCallback(async () => {
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
  }, []);

  /**
   * Obtiene un producto de ejemplo para el simulador live
   */
  const fetchSampleProduct = useCallback(async () => {
    try {
      const res = await fetch("/api/local/menu");
      const { data } = await res.json();
      if (data && data.length > 0) {
        setSampleProduct(data[0]);
      }
    } catch (e) {
      console.error("Error al obtener producto de ejemplo:", e);
    }
  }, []);

  // Inicialización
  useEffect(() => {
    fetchThemes();
    fetchSampleProduct();
  }, [slug, fetchThemes, fetchSampleProduct]);

  // Sincronización de fuentes dinámicas
  useEffect(() => {
    loadGoogleFonts(currentTheme.fontTitle, currentTheme.fontBody, currentTheme.fontAccent);
  }, [currentTheme.fontTitle, currentTheme.fontBody, currentTheme.fontAccent]);

  /**
   * Persiste el diseño actual
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
        window.dispatchEvent(new Event("theme-updated"));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error al guardar marca:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    slug,
    themes,
    activeTheme,
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
    fetchThemes,
  };
}
