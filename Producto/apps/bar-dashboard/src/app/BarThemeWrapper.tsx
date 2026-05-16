"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useThemeSync } from "@menu-bites/auth";
import { RestaurantThemeProvider, RestaurantTheme } from "@menu-bites/ui";

/**
 * BarThemeWrapper - Proveedor dinámico de temas para el dashboard de Bar.
 * Centraliza la lógica de sincronización de marca para asegurar que todas las
 * páginas y componentes del bar reflejen la identidad visual del restaurante.
 * 
 * Mejoras Pro Max:
 * - Sincronización en tiempo real vía useThemeSync (PostgreSQL Realtime).
 * - Soporte para previsualización instantánea desde el laboratorio de diseño.
 */
export default function BarThemeWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  
  // Sincronización en tiempo real con la base de datos
  const liveTheme = useThemeSync(user?.restaurantId, "bar");
  
  const [theme, setTheme] = useState<RestaurantTheme | undefined>(undefined);

  // Actualizar el tema cuando cambie en la base de datos
  useEffect(() => {
    if (liveTheme) {
      setTheme(liveTheme as any);
    }
  }, [liveTheme]);

  // Soporte para previsualización instantánea (Branding Laboratory)
  useEffect(() => {
    const handleThemeUpdate = (e: CustomEvent<RestaurantTheme>) => {
      if (e.detail) {
        setTheme(e.detail);
      }
    };

    window.addEventListener('admin-theme-preview', handleThemeUpdate as any);
    return () => window.removeEventListener('admin-theme-preview', handleThemeUpdate as any);
  }, []);

  return (
    <RestaurantThemeProvider theme={theme} isGlobal>
      {children}
    </RestaurantThemeProvider>
  );
}
