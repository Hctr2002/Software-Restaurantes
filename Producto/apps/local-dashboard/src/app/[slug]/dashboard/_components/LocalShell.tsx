"use client";
 
import React from "react";
import { usePathname, useParams } from "next/navigation";
import { useAuthStore } from "@menu-bites/store";
import { supabase, signOut, getRestaurantTheme } from "@menu-bites/auth";
import { RestaurantThemeProvider, PortalHeading, PortalText } from "@menu-bites/ui";
import { motion, AnimatePresence } from "framer-motion";

// Modular Components
import Sidebar from "./Sidebar";
import MobileMenu from "./MobileMenu";
import DashboardHeader from "./DashboardHeader";
 
type LocalShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};
 
export default function LocalShell({ title, subtitle, children }: LocalShellProps) {
  const pathname = usePathname();
  const params  = useParams();
  const slug    = (params?.slug as string) || '';
  const base    = `/${slug}/dashboard`;
  
  const { user, logout: clearAuth } = useAuthStore();
  
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<any>(null);
 
  // Función para gestionar el cierre de sesión y redirección al portal de autenticación
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      clearAuth();
      window.location.href = process.env.NEXT_PUBLIC_AUTH_URL ?? '/';
    }
  };
 
  // Efecto para cargar y sincronizar el tema del restaurante en tiempo real
  React.useEffect(() => {
    if (!user?.restaurantId) return;
    const restaurantId = user.restaurantId;
 
    const loadTheme = async () => {
      const themeData = await getRestaurantTheme(restaurantId);
      if (themeData) setTheme(themeData);
    };
 
    loadTheme();
 
    // Escucha de eventos locales para actualización inmediata del tema
    window.addEventListener("theme-updated", loadTheme);
 
    // Suscripción a cambios en Supabase para reflejar cambios de branding en tiempo real
    const channel = supabase
      .channel(`localshell-theme-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "restaurant_themes", filter: `restaurant_id=eq.${restaurantId}` },
        async (payload) => {
          if ((payload.new as any)?.is_active) {
            const updated = await getRestaurantTheme(restaurantId);
            if (updated) setTheme(updated);
          }
        }
      )
      .subscribe();
 
    return () => {
      window.removeEventListener("theme-updated", loadTheme);
      supabase.removeChannel(channel);
    };
  }, [user?.restaurantId]);
 
  return (
    <RestaurantThemeProvider theme={theme} isGlobal={true}>
      <div className="h-screen wow-gradient text-foreground font-sans flex transition-colors duration-500 overflow-hidden">
        
        {/* Mobile Navigation */}
        <MobileMenu 
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          user={user}
          pathname={pathname}
          base={base}
          isSigningOut={isSigningOut}
          onSignOut={handleSignOut}
        />

        {/* Desktop Sidebar */}
        <aside className="fixed left-6 top-6 bottom-6 w-64 bg-card border border-border rounded-[2.5rem] z-50 hidden lg:flex flex-col shadow-2xl shadow-black/5 overflow-hidden">
          <Sidebar 
            user={user}
            pathname={pathname}
            base={base}
            isSigningOut={isSigningOut}
            onSignOut={handleSignOut}
          />
        </aside>

        {/* Main Content Area */}
        <main className="lg:pl-[19rem] flex-1 flex flex-col h-screen overflow-y-auto pr-0 lg:pr-6 custom-scrollbar relative">
          
          <DashboardHeader 
            title={title}
            subtitle={subtitle}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
 
          {/* Área de Contenido Principal de la Página */}
          <div className="p-4 lg:p-8 custom-scrollbar">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex flex-col space-y-1 mb-10">
                {/* Título de la página usando primitivos de UI para consistencia de branding */}
                <PortalHeading as="h1" className="text-4xl font-black tracking-tighter uppercase italic">
                  {subtitle}
                </PortalHeading>
                <div className="h-1.5 w-12 bg-primary rounded-full shadow-lg shadow-primary/20" />
              </div>
              {children}
            </div>
          </div>
        </main>
      </div>
    </RestaurantThemeProvider>
  );
}
