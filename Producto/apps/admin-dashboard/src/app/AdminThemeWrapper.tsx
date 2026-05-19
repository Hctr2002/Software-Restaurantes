"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@menu-bites/store";
import { useThemeSync } from "@menu-bites/auth";
import { RestaurantThemeProvider, RestaurantTheme } from "@menu-bites/ui";

interface ThemePreviewEvent extends CustomEvent {
  detail: RestaurantTheme;
}

// Tema verde salvia (Sage Green) premium e inmutable por defecto para el Super-Admin del multitenant.
// Inspirado en el diseño premium de la paleta del customer-portal (http://localhost:3005).
const defaultSuperAdminTheme: RestaurantTheme = {
  primaryColor: "#75a388",     // Verde Salvia (Sage Green)
  backgroundColor: "#020617",  // Slate-Black Canvas (Coincide con customer-portal #020617)
  textColor: "#f8f8f6",        // Warm Foreground Off-white
  accentColor: "#f49d25",       // Amber/Gold Accent
  cardBackground: "#0f172a",   // Slate-900 Cards (Coincide con customer-portal #0f172a)
  secondaryColor: "#1e293b",   // Slate-800 Borders (Coincide con customer-portal #1e293b)
  fontTitle: "Outfit",
  fontBody: "Inter"
};

/**
 * AdminThemeWrapper - Proveedor dinámico de temas para el panel de administración.
 * 
 * A diferencia de los terminales operativos (Bar/Cocina), el Admin tiene una doble función:
 * 1. Reflejar la marca persistida en la base de datos (vía useThemeSync) para Admins de restaurantes.
 * 2. Cargar el tema neutro/personalizado para el Super-Admin del multitenant.
 * 3. Reaccionar a cambios "en vivo" del Laboratorio de Branding sin necesidad de guardarlos.
 */
const AUTH_ROUTES = ["/", "/forgot-password", "/reset-password"];

export default function AdminThemeWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAuthRoute = AUTH_ROUTES.includes(pathname) || pathname.startsWith("/auth/");

  const hasLoadedUser = user !== undefined && user !== null;
  const isSuperAdmin = user?.role === "SUPER_ADMIN" || (hasLoadedUser && !user?.restaurantId);

  // Sincronización en tiempo real con la base de datos para temas del restaurante (slug/tenant)
  // Solo se activa si el usuario NO es Super-Admin del multitenant
  const liveTheme = useThemeSync(isSuperAdmin ? undefined : user?.restaurantId, "admin");
  
  const [theme, setTheme] = useState<RestaurantTheme | undefined>(undefined);

  // Sincronizar el tema según el rol y la metadata del usuario
  useEffect(() => {
    if (isSuperAdmin) {
      // El Super-Admin del multitenant siempre utiliza la paleta verde salvia premium neutral
      // para asegurar un entorno de gestión sobrio, profesional y libre de leaks cromáticos.
      setTheme(defaultSuperAdminTheme);
    } else if (liveTheme) {
      // Si es un admin normal asociado a un restaurante, aplicamos el tema del restaurante
      setTheme(liveTheme);
    } else if (liveTheme === null) {
      setTheme(undefined);
    }
  }, [liveTheme, isSuperAdmin]);

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
    const handlePreview = (event: Event) => {
      if (isSuperAdmin) return; // El Super-Admin tiene un tema inmutable y no se ve afectado
      const { detail } = event as ThemePreviewEvent;
      if (detail) {
        if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
        previewTimerRef.current = setTimeout(() => setTheme(detail), 300);
      }
    };

    window.addEventListener("admin-theme-preview", handlePreview);
    return () => {
      window.removeEventListener("admin-theme-preview", handlePreview);
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, [isSuperAdmin]);

  if (isAuthRoute) return <>{children}</>;

  return (
    <RestaurantThemeProvider theme={theme} isGlobal={true}>
      {children}
    </RestaurantThemeProvider>
  );
}
