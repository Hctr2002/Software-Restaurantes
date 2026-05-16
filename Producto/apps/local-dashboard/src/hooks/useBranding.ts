"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PALETTE_TEMPLATES } from "@/lib/constants/palettes";
import { loadGoogleFonts } from "@/lib/brandingUtils";

export type SaveModalMode = "save-new" | "update-or-new" | null;

export function useBranding() {
  const params = useParams();
  const slug = params?.slug as string;

  const [themes, setThemes] = useState<any[]>([]);
  const [activeTheme, setActiveTheme] = useState<any>(null);
  const [currentTheme, setCurrentTheme] = useState<any>(PALETTE_TEMPLATES[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [customName, setCustomName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sampleProduct, setSampleProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"style" | "fonts" | "business">("style");

  // Origen del tema en edición: DB id si viene de un tema guardado, null si es preset del carrusel
  const [originThemeId, setOriginThemeId] = useState<string | null>(null);
  // Nombre del tema origen para mostrarlo en el modal
  const [originThemeName, setOriginThemeName] = useState<string | null>(null);
  // Hay cambios sin guardar respecto al origen
  const [isDirty, setIsDirty] = useState(false);
  // Controla el modal de guardado
  const [saveModalMode, setSaveModalMode] = useState<SaveModalMode>(null);

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
          logoUrl: active.logo_url,
        });
        setOriginThemeId(active.id);
        setOriginThemeName(active.name);
        setIsDirty(false);
      }
    } catch (error) {
      console.error("Error al obtener temas:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSampleProduct = useCallback(async () => {
    try {
      const res = await fetch("/api/local/menu");
      const { data } = await res.json();
      if (data && data.length > 0) setSampleProduct(data[0]);
    } catch (e) {
      console.error("Error al obtener producto de ejemplo:", e);
    }
  }, []);

  useEffect(() => {
    fetchThemes();
    fetchSampleProduct();
  }, [slug, fetchThemes, fetchSampleProduct]);

  useEffect(() => {
    loadGoogleFonts(currentTheme.fontTitle, currentTheme.fontBody, currentTheme.fontAccent);
  }, [currentTheme.fontTitle, currentTheme.fontBody, currentTheme.fontAccent]);

  /** Selecciona un preset del carrusel — no marca como dirty */
  const selectCarouselTheme = (theme: any) => {
    setCurrentTheme(theme);
    setOriginThemeId(null);
    setOriginThemeName(null);
    setIsDirty(false);
    setCustomName("");
  };

  /** Edición del tema actual desde los tabs — marca como dirty */
  const editCurrentTheme = (theme: any) => {
    setCurrentTheme(theme);
    setIsDirty(true);
  };

  /**
   * Lógica principal del botón "Aplicar Marca":
   * - Sin cambios + preset carrusel → aplica directo (guarda como is_custom: false)
   * - Sin cambios + tema guardado → solo activa (PATCH)
   * - Con cambios + tema guardado → abre modal update-or-new
   * - Con cambios + preset carrusel → abre modal save-new
   */
  const handleApply = async () => {
    if (!isDirty) {
      if (originThemeId) {
        // Activar el tema guardado existente sin cambios
        await handleActivateTheme(originThemeId);
      } else {
        // Aplicar preset del carrusel tal cual (sin guardarlo en SavedThemes)
        await _saveTheme({ isCustom: false, isActive: true });
      }
      return;
    }
    // Hay cambios — abrir modal
    setSaveModalMode(originThemeId ? "update-or-new" : "save-new");
  };

  /** Guarda cambios sobre el tema guardado existente */
  const handleUpdateTheme = async () => {
    if (!originThemeId) return false;
    setIsSaving(true);
    try {
      const res = await fetch("/api/local/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeId: originThemeId,
          action: "update",
          primaryColor: currentTheme.primaryColor,
          secondaryColor: currentTheme.secondaryColor,
          backgroundColor: currentTheme.backgroundColor,
          accentColor: currentTheme.accentColor,
          textColor: currentTheme.textColor,
          cardBackground: currentTheme.cardBackground,
          fontTitle: currentTheme.fontTitle || "Outfit",
          fontBody: currentTheme.fontBody || "Inter",
          fontAccent: currentTheme.fontAccent || "Outfit",
          logoUrl: currentTheme.logoUrl,
        }),
      });
      if (res.ok) {
        setIsDirty(false);
        setSaveModalMode(null);
        await fetchThemes();
        window.dispatchEvent(new Event("theme-updated"));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error al actualizar tema:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  /** Guarda como tema nuevo en SavedThemes (is_custom: true) */
  const handleSaveAsNew = async () => {
    const result = await _saveTheme({ isCustom: true, isActive: true });
    if (result) setSaveModalMode(null);
    return result;
  };

  /** Interno — persiste el tema con las opciones dadas */
  const _saveTheme = async (opts: { isCustom: boolean; isActive: boolean }) => {
    setIsSaving(true);
    try {
      const payload = {
        name: opts.isCustom ? customName || "Tema Personalizado" : (currentTheme.name || currentTheme.paletteName || "Preset"),
        paletteName: currentTheme.id || currentTheme.paletteName,
        isCustom: opts.isCustom,
        isActive: opts.isActive,
        primaryColor: currentTheme.primaryColor,
        secondaryColor: currentTheme.secondaryColor,
        backgroundColor: currentTheme.backgroundColor,
        accentColor: currentTheme.accentColor,
        textColor: currentTheme.textColor,
        cardBackground: currentTheme.cardBackground,
        fontTitle: currentTheme.fontTitle || "Outfit",
        fontBody: currentTheme.fontBody || "Inter",
        fontAccent: currentTheme.fontAccent || "Outfit",
        logoUrl: currentTheme.logoUrl,
      };

      const res = await fetch("/api/local/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setCustomName("");
        setIsDirty(false);
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

  const handleDeleteTheme = async (themeId: string) => {
    try {
      const res = await fetch(`/api/local/theme?themeId=${themeId}`, { method: "DELETE" });
      if (res.ok) { await fetchThemes(); return true; }
      return false;
    } catch (error) {
      console.error("Error al eliminar tema:", error);
      return false;
    }
  };

  const handleDeleteThemes = async (themeIds: string[]) => {
    if (themeIds.length === 0) return false;
    try {
      const res = await fetch(`/api/local/theme?themeIds=${themeIds.join(",")}`, { method: "DELETE" });
      if (res.ok) { await fetchThemes(); return true; }
      return false;
    } catch (error) {
      console.error("Error al eliminar temas:", error);
      return false;
    }
  };

  const handleActivateTheme = async (themeId: string) => {
    try {
      const res = await fetch("/api/local/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId, action: "activate" }),
      });
      if (res.ok) {
        await fetchThemes();
        window.dispatchEvent(new Event("theme-updated"));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error al activar tema:", error);
      return false;
    }
  };

  return {
    slug,
    themes,
    activeTheme,
    currentTheme,
    setCurrentTheme,
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
    fetchThemes,
  };
}
