"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useThemeSync } from "@menu-bites/auth";
import { RestaurantThemeProvider, RestaurantTheme } from "@menu-bites/ui";

/**
 * LocalThemeWrapper - Proveedor dinámico de temas para el Dashboard Local.
 * 
 * Este wrapper es crítico ya que el Dashboard Local es donde se encuentra el
 * Laboratorio de Branding. Necesita manejar dos tipos de actualizaciones:
 * 1. Sincronización con la base de datos (Supabase Realtime) vía useThemeSync.
 * 2. Previsualización instantánea vía Custom Events para cambios no guardados.
 */
export default function LocalThemeWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  
  // Sincronización persistente con la base de datos
  const liveTheme = useThemeSync(user?.restaurantId, "local");
  
  const [theme, setTheme] = useState<RestaurantTheme | undefined>(undefined);

  // Cuando el tema en la base de datos cambia (vía Realtime), actualizamos el estado local
  useEffect(() => {
    if (liveTheme) {
      setTheme(liveTheme as any);
    }
  }, [liveTheme]);

  /**
   * Escuchar eventos de previsualización del Laboratorio de Branding.
   * Esto permite que el usuario vea los cambios en tiempo real mientras mueve los controles
   * de color o cambia las tipografías, antes de presionar "Guardar".
   */
  useEffect(() => {
    const handleThemeUpdate = (e: CustomEvent<RestaurantTheme>) => {
      if (e.detail) {
        setTheme(e.detail);
      }
    };

    // Escuchamos el evento de previsualización que emite el componente de diseño
    window.addEventListener('admin-theme-preview', handleThemeUpdate as any);
    return () => window.removeEventListener('admin-theme-preview', handleThemeUpdate as any);
  }, []);

  return (
    // El RestaurantThemeProvider inyecta las variables HSL en el documento (:root)
    <RestaurantThemeProvider theme={theme} isGlobal>
      {children}
    </RestaurantThemeProvider>
  );
}
