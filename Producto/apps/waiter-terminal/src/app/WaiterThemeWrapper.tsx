"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useThemeSync } from "@menu-bites/auth";
import { RestaurantThemeProvider, RestaurantTheme } from "@menu-bites/ui";

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

export default function WaiterThemeWrapper({ children }: { children: React.ReactNode }) {
  const { user }  = useAuthStore();
  const liveTheme = useThemeSync(user?.restaurantId, "waiter");
  const [theme, setTheme] = useState<RestaurantTheme | undefined>(undefined);

  useEffect(() => {
    if (liveTheme) setTheme(liveTheme as any);
  }, [liveTheme]);

  useEffect(() => {
    return () => {
      THEME_VARS.forEach(v => document.documentElement.style.removeProperty(v));
    };
  }, []);

  useEffect(() => {
    const handlePreview = (e: CustomEvent<RestaurantTheme>) => {
      if (e.detail) setTheme(e.detail);
    };
    window.addEventListener('admin-theme-preview', handlePreview as any);
    return () => window.removeEventListener('admin-theme-preview', handlePreview as any);
  }, []);

  return (
    <RestaurantThemeProvider theme={theme} isGlobal>
      {children}
    </RestaurantThemeProvider>
  );
}
