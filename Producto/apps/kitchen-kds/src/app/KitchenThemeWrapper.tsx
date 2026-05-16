"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useThemeSync } from "@menu-bites/auth";
import { RestaurantThemeProvider, RestaurantTheme } from "@menu-bites/ui";

/**
 * KitchenThemeWrapper - Proveedor dinámico de temas para el KDS de Cocina.
 * 
 * Este componente es el corazón visual del monitor de cocina. Su función es:
 * 1. Conectarse a Supabase Realtime para recibir actualizaciones de marca al instante.
 * 2. Inyectar variables CSS (HSL) globales que Tailwind utiliza para renderizar colores.
 * 3. Permitir que el administrador previsualice cambios de diseño sin guardarlos.
 */
export default function KitchenThemeWrapper({ children }: { children: React.ReactNode }) {
  // Obtenemos el usuario actual para identificar a qué restaurante pertenece
  const { user } = useAuthStore();
  
  // Hook personalizado que maneja la suscripción a canales de PostgreSQL Realtime.
  // Filtra por restaurantId y el perfil específico 'kitchen'.
  const liveTheme = useThemeSync(user?.restaurantId, "kitchen");
  
  // Estado local para manejar el tema, permitiendo cambios rápidos por eventos de preview
  const [theme, setTheme] = useState<RestaurantTheme | undefined>(undefined);

  // Sincroniza el estado local cada vez que la base de datos emite un cambio de branding
  useEffect(() => {
    if (liveTheme) {
      setTheme(liveTheme as any);
    }
  }, [liveTheme]);

  /**
   * Manejador de eventos para el Laboratorio de Diseño.
   * Permite que la aplicación reaccione a cambios en el editor de temas del Admin
   * sin necesidad de persistir los cambios en la base de datos todavía.
   */
  useEffect(() => {
    const handleThemeUpdate = (e: CustomEvent<RestaurantTheme>) => {
      if (e.detail) {
        setTheme(e.detail);
      }
    };

    // Escuchamos el evento personalizado emitido por el componente LivePreview
    window.addEventListener('admin-theme-preview', handleThemeUpdate as any);
    return () => window.removeEventListener('admin-theme-preview', handleThemeUpdate as any);
  }, []);

  return (
    // RestaurantThemeProvider inyecta los tokens de diseño (colores, fuentes, bordes)
    // El flag isGlobal asegura que se apliquen al <html> y <body> del documento.
    <RestaurantThemeProvider theme={theme} isGlobal>
      {children}
    </RestaurantThemeProvider>
  );
}
