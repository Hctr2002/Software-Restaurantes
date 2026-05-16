"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useThemeSync } from "@menu-bites/auth";
import { RestaurantThemeProvider, RestaurantTheme } from "@menu-bites/ui";

/**
 * WaiterThemeWrapper - Proveedor dinámico de temas para la Terminal de Garzón.
 * 
 * Este componente asegura que la terminal móvil herede correctamente la identidad
 * visual del restaurante (colores, tipografías) en tiempo real.
 * 
 * Funcionalidades:
 * - Sincronización automática con Supabase Realtime.
 * - Soporte para previsualización de marca desde el laboratorio administrativo.
 * - Inyección global de estilos CSS para asegurar coherencia en toda la navegación.
 */
export default function WaiterThemeWrapper({ children }: { children: React.ReactNode }) {
  // Obtenemos el usuario autenticado para saber qué restaurante estamos operando
  const { user } = useAuthStore();
  
  // Hook de sincronización que escucha cambios en el branding del restaurante
  const liveTheme = useThemeSync(user?.restaurantId, "waiter");
  
  // Estado local para el tema actual
  const [theme, setTheme] = useState<RestaurantTheme | undefined>(undefined);

  // Actualizamos el tema local cuando hay cambios en el servidor
  useEffect(() => {
    if (liveTheme) {
      setTheme(liveTheme as any);
    }
  }, [liveTheme]);

  /**
   * Escucha de eventos para previsualización en vivo.
   * Útil para que los diseñadores vean cómo se ve la terminal mientras editan el tema.
   */
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
    // Inyectamos el tema globalmente en el documento
    <RestaurantThemeProvider theme={theme} isGlobal>
      {children}
    </RestaurantThemeProvider>
  );
}
