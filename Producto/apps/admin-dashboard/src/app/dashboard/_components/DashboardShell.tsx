"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@menu-bites/store";
import { signOut } from "@menu-bites/auth";
import { Button } from "@menu-bites/ui";
import { LayoutDashboard, Store, Users, LogOut, ChevronRight, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type DashboardShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function DashboardShell({ title, subtitle, children }: DashboardShellProps) {
  const pathname = usePathname();
  const { user, logout: clearAuth } = useAuthStore();
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      clearAuth();
      window.location.href = '/';
    }
  };

  // Apply custom theme if exists in user metadata
  React.useEffect(() => {
    const theme = user?.user_metadata?.theme;
    
    const applyTheme = (t: any) => {
      if (!t) return;
      const root = document.documentElement;
      
      const mapping: Record<string, string> = {
        primaryColor: "--primary",
        backgroundColor: "--background",
        textColor: "--foreground",
        accentColor: "--accent",
        cardBackground: "--card",
        secondaryColor: "--secondary"
      };

      Object.entries(t).forEach(([key, value]) => {
        const cssVar = mapping[key];
        if (cssVar && typeof value === 'string' && value.startsWith('#')) {
          // Convert Hex to HSL values (numbers only) as expected by Tailwind config
          const hsl = hexToHslValues(value);
          root.style.setProperty(cssVar, hsl);
          
          // Also set the foreground for primary/accent for contrast
          if (cssVar === '--primary' || cssVar === '--accent') {
            root.style.setProperty(`${cssVar}-foreground`, "0 0% 100%"); // Default white
          }
        }
      });
    };

    applyTheme(theme);
    
    const handleThemeUpdate = (e: any) => {
      if (e.detail) applyTheme(e.detail);
    };
    
    window.addEventListener('admin-theme-preview', handleThemeUpdate as any);
    return () => window.removeEventListener('admin-theme-preview', handleThemeUpdate as any);
  }, [user]);


  const NavContent = () => (
    <>
      {/* Brand */}
      <div className="h-24 flex items-center px-8 border-b border-white/5">
        <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center mr-3 shadow-lg shadow-primary/20">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-black text-white tracking-tighter uppercase italic">Menu <span className="text-primary">Bites</span></h2>
          <p className="text-[9px] text-slate-400 font-bold tracking-[0.2em] uppercase">Admin Hub</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-8 px-4 space-y-8 no-scrollbar">
        <div>
          <p className="px-4 text-[10px] font-black text-slate-500 mb-4 tracking-[0.2em] uppercase">Principal</p>
          <nav className="space-y-1">
            <NavItem href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Resumen" active={pathname === "/dashboard"} />
          </nav>
        </div>

        <div>
          <p className="px-4 text-[10px] font-black text-slate-500 mb-4 tracking-[0.2em] uppercase">Directorio</p>
          <nav className="space-y-1">
            <NavItem href="/dashboard/restaurants" icon={<Store className="w-4 h-4" />} label="Organizaciones" active={pathname.startsWith("/dashboard/restaurants")} />
            <NavItem href="/dashboard/users" icon={<Users className="w-4 h-4" />} label="Usuarios Globales" active={pathname.startsWith("/dashboard/users")} />
          </nav>
        </div>

        <div>
          <p className="px-4 text-[10px] font-black text-slate-500 mb-4 tracking-[0.2em] uppercase">Sistema</p>
          <nav className="space-y-1">
            <NavItem href="/dashboard/settings/profile" icon={<Settings className="w-4 h-4" />} label="Configuración" active={pathname.startsWith("/dashboard/settings")} />
          </nav>
        </div>
      </div>

      {/* User Profile & Sign Out */}
      <div className="p-6 bg-white/5 border-t border-white/5">
        <div className="flex items-center space-x-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
            <span className="text-xs font-black text-primary">{user?.email?.charAt(0).toUpperCase() || "U"}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[11px] font-bold text-foreground truncate">{user?.email}</p>
            <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest truncate">{user?.role}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start h-11 px-4 rounded-2xl bg-white/5 border-white/5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all duration-300 group"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">{isSigningOut ? "Saliendo..." : "Cerrar Sesión"}</span>
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen wow-gradient text-foreground font-sans flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-navy/95 backdrop-blur-2xl border-r border-white/10 z-[70] lg:hidden flex flex-col overflow-hidden shadow-2xl"
            >
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="fixed left-6 top-6 bottom-6 w-64 glass-premium rounded-[2.5rem] z-50 hidden lg:flex flex-col overflow-hidden">
        <NavContent />
      </aside>
 
      {/* Main Content Area */}
      <main className="lg:pl-[19rem] flex-1 flex flex-col min-h-screen pr-0 lg:pr-6">
        {/* Header with Breadcrumbs & Mobile Toggle */}
        <header className="h-20 flex items-center px-4 lg:px-8 sticky top-0 z-40 bg-navy/50 backdrop-blur-md lg:bg-transparent">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden mr-4 text-white hover:bg-white/10"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <LayoutDashboard className="w-6 h-6" />
          </Button>

          <div className="glass px-4 lg:px-6 py-2 rounded-2xl flex items-center text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-black/20">
            <span className="text-slate-500 hover:text-primary cursor-pointer transition-colors hidden sm:inline">{title}</span>
            <ChevronRight className="w-3 h-3 mx-3 text-slate-700 hidden sm:inline" />
            <span className="text-foreground truncate max-w-[150px] sm:max-w-none">{subtitle}</span>
          </div>
        </header>

        {/* Page Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 p-4 lg:p-8 overflow-x-hidden"
          >
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Page Title Header */}
              <div className="flex flex-col space-y-1 mb-10">
                <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">{subtitle}</h1>
                <div className="h-1.5 w-12 bg-primary rounded-full shadow-lg shadow-primary/20" />
              </div>
              
              {children}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <div>
      <Link
        href={href}
        className={`relative w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
          active
            ? "bg-primary text-white shadow-lg shadow-primary/20"
            : "text-slate-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        <div className={`transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}>
          {icon}
        </div>
        <span className={`text-[11px] font-bold uppercase tracking-widest ${active ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}>
          {label}
        </span>
        {active && (
          <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full" />
        )}
      </Link>
    </div>
  );
}

/**
 * Convierte un color Hexadecimal (#RRGGBB) a una cadena de valores HSL compatibles con Tailwind.
 * @param hex - Color en formato hexadecimal.
 * @returns Cadena con valores HSL separados por espacios.
 */
function hexToHslValues(hex: string): string {
  if (!hex) return "0 0% 0%";
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
