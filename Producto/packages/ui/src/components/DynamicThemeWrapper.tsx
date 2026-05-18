"use client";

/**
 * DynamicThemeWrapper — Wrapper de tema para apps operacionales (bar, waiter, kitchen, cashier).
 * Combina tres fuentes de tema en orden de prioridad:
 * 1. Caché localStorage (carga síncrona para anti-FOUC)
 * 2. Suscripción Realtime vía useThemeSync (actualización en vivo)
 * 3. Evento 'admin-theme-preview' (previsualización instantánea desde el laboratorio de branding)
 */

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useThemeSync } from "@menu-bites/auth";
import { RestaurantThemeProvider, RestaurantTheme } from "./RestaurantThemeProvider";

interface DynamicThemeWrapperProps {
  appKey: string;
  children: React.ReactNode;
}

/**
 * DynamicThemeWrapper
 * Unifica la lógica de sincronización de temas en tiempo real, gestión de caché
 * en localStorage para mitigación de FOUC, y soporte para previsualizaciones en vivo.
 */
export const DynamicThemeWrapper = ({ appKey, children }: DynamicThemeWrapperProps) => {
  const { user } = useAuthStore();
  const cacheKey = `mb-theme-${appKey}`;

  // 1. Obtener el tema live en tiempo real a través del hook unificado de la base de datos
  const liveTheme = useThemeSync(user?.restaurantId, appKey);

  // 2. Inicialización síncrona/perezosa desde localStorage para evitar FOUC en la carga inicial
  const [theme, setTheme] = useState<RestaurantTheme | undefined>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          return JSON.parse(cached) as RestaurantTheme;
        }
      } catch (e) {
        console.error(`[ThemeWrapper-${appKey}] Error al leer caché:`, e);
      }
    }
    return undefined;
  });

  // 3. Sincronizar el tema en tiempo real cuando cambie la suscripción y guardarlo en la caché local
  useEffect(() => {
    if (liveTheme) {
      setTheme(liveTheme as RestaurantTheme);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(liveTheme));
      } catch (e) {
        console.error(`[ThemeWrapper-${appKey}] Error al guardar en caché:`, e);
      }
    } else if (liveTheme === null && user?.restaurantId) {
      // Limpia el caché solo si el restaurantId era conocido y la BD no devolvió tema
      setTheme(undefined);
      try {
        localStorage.removeItem(cacheKey);
      } catch (e) {
        console.error(`[ThemeWrapper-${appKey}] Error al limpiar caché:`, e);
      }
    }
  }, [liveTheme, cacheKey, appKey]);

  // 4. Suscribirse al evento del Laboratorio de Branding 'admin-theme-preview' para previsualización instantánea en vivo
  useEffect(() => {
    const handlePreview = (e: CustomEvent<RestaurantTheme>) => {
      if (e.detail) {
        setTheme(e.detail);
      }
    };
    window.addEventListener("admin-theme-preview", handlePreview as EventListener);
    return () => {
      window.removeEventListener("admin-theme-preview", handlePreview as EventListener);
    };
  }, []);

  return (
    <RestaurantThemeProvider theme={theme} isGlobal>
      {children}
    </RestaurantThemeProvider>
  );
};
