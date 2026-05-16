"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useThemeSync } from "@menu-bites/auth";
import { RestaurantThemeProvider, RestaurantTheme } from "@menu-bites/ui";

/**
 * AdminThemeWrapper - Proveedor dinámico de temas para el panel de administración.
 * 
 * A diferencia de los terminales operativos (Bar/Cocina), el Admin tiene una doble función:
 * 1. Reflejar la marca persistida en la base de datos (vía useThemeSync).
 * 2. Reaccionar a cambios "en vivo" del Laboratorio de Branding sin necesidad de guardarlos.
 */
export default function AdminThemeWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  
  // Sincronización en tiempo real con la base de datos. 
  // Esto asegura que si otro administrador cambia el tema, este panel se actualice.
  const liveTheme = useThemeSync(user?.restaurantId, "admin");
  
  const [theme, setTheme] = useState<RestaurantTheme | undefined>(undefined);

  // Sincronizar el tema cuando cambie en la base de datos
  useEffect(() => {
    if (liveTheme) {
      setTheme(liveTheme as any);
    }
  }, [liveTheme]);

  /**
   * Escuchar eventos de previsualización instantánea.
   * Este evento es disparado por el componente 'LivePreview' dentro del Laboratorio de Branding.
   * Permite que el administrador vea cómo queda su diseño antes de confirmar y guardar.
   */
  useEffect(() => {
    /**
     * Escuchador de eventos para el Laboratorio de Diseño.
     * Permite que los cambios realizados en el configurador de marca se reflejen
     * inmediatamente en toda la UI del admin sin necesidad de guardar en la DB.
     */
    const handlePreview = (event: any) => {
      if (event.detail) {
        setTheme(event.detail);
      }
    };

    window.addEventListener("admin-theme-preview", handlePreview);
    return () => window.removeEventListener("admin-theme-preview", handlePreview);
  }, []);

  return (
    // Proveedor que propaga el tema y aplica las variables CSS globales
    <RestaurantThemeProvider theme={theme} isGlobal={true}>
      {children}
    </RestaurantThemeProvider>
  );
}
