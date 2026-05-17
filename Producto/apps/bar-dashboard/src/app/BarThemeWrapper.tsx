"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@menu-bites/store";
import { useThemeSync } from "@menu-bites/auth";
import { RestaurantThemeProvider, RestaurantTheme } from "@menu-bites/ui";

// CSS vars set by RestaurantThemeProvider — removed on public routes so
// the login page always renders with the default globals.css palette.
const THEME_VARS = [
  '--primary', '--primary-foreground',
  '--secondary', '--secondary-foreground',
  '--background', '--foreground',
  '--card', '--card-foreground',
  '--accent', '--accent-foreground',
  '--border', '--input', '--muted', '--muted-foreground',
  '--font-title', '--font-title-stack',
  '--font-body', '--font-body-stack',
  '--font-accent', '--font-accent-stack',
  '--font-outfit', '--font-inter',
  '--sage', '--navy', '--sand', '--brand-accent',
];

export default function BarThemeWrapper({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const { user }  = useAuthStore();
  const liveTheme = useThemeSync(user?.restaurantId, "bar");
  const [theme, setTheme] = useState<RestaurantTheme | undefined>(undefined);

  const isPublicRoute = pathname === '/login' || pathname.startsWith('/auth/');

  // Remove all restaurant CSS vars when entering a public route so the
  // login page always falls back to globals.css defaults.
  useEffect(() => {
    if (isPublicRoute) {
      THEME_VARS.forEach(v => document.documentElement.style.removeProperty(v));
      setTheme(undefined);
    }
  }, [isPublicRoute]);

  useEffect(() => {
    if (!isPublicRoute && liveTheme) {
      setTheme(liveTheme as any);
    }
  }, [liveTheme, isPublicRoute]);

  useEffect(() => {
    const handleThemeUpdate = (e: CustomEvent<RestaurantTheme>) => {
      if (e.detail && !isPublicRoute) setTheme(e.detail);
    };
    window.addEventListener('admin-theme-preview', handleThemeUpdate as any);
    return () => window.removeEventListener('admin-theme-preview', handleThemeUpdate as any);
  }, [isPublicRoute]);

  return (
    <RestaurantThemeProvider theme={isPublicRoute ? undefined : theme} isGlobal>
      {children}
    </RestaurantThemeProvider>
  );
}
