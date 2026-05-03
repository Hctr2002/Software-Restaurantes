"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import AlertsPanel from "./AlertsPanel";
import { useAuthStore } from "@menu-bites/store";
import { supabase, signOut, getRestaurantTheme } from "@menu-bites/auth";
import { Button, RestaurantThemeProvider } from "@menu-bites/ui";
import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  TableProperties,
  ClipboardList,
  LogOut,
  ChevronRight,
  Settings,
  Tag,
  BarChart2,
  Users,
  Menu,
  X,
  Package,
  Palette,
} from "lucide-react";

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

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      clearAuth();
      window.location.href = process.env.NEXT_PUBLIC_AUTH_URL ?? '/';
    }
  };

  React.useEffect(() => {
    if (!user?.restaurantId) return;
    const restaurantId = user.restaurantId;

    const loadTheme = async () => {
      const themeData = await getRestaurantTheme(restaurantId);
      if (themeData) setTheme(themeData);
    };

    loadTheme();

    window.addEventListener("theme-updated", loadTheme);

    const channel = supabase
      .channel(`localshell-theme-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "restaurant_themes", filter: `restaurant_id=eq.${restaurantId}` },
        async (payload) => {
          if (payload.new.is_active) {
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
      <div className="min-h-screen bg-background text-foreground font-sans flex transition-colors duration-500">
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-card border-r border-white/5 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center mr-3 shrink-0">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-foreground tracking-tight leading-tight">Menu Bites</h2>
            <p className="text-[10px] text-foreground/40 font-medium">Panel Local</p>
          </div>
          <button
            className="lg:hidden p-1 rounded text-foreground/40 hover:text-foreground hover:bg-white/5 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
          <div>
            <p className="px-3 text-xs font-bold text-foreground/30 mb-2 tracking-wider">PANEL PRINCIPAL</p>
            <nav className="space-y-0.5">
              <NavItem href={base} icon={<LayoutDashboard className="w-4 h-4" aria-hidden="true" />} label="Resumen" active={pathname === base} onClick={() => setIsMobileMenuOpen(false)} />
            </nav>
          </div>

          <div>
            <p className="px-3 text-xs font-bold text-foreground/30 mb-2 tracking-wider">GESTIÓN</p>
            <nav className="space-y-0.5">
              <NavItem href={`${base}/users`}      icon={<Users className="w-4 h-4" aria-hidden="true" />}           label="Usuarios"   active={pathname.startsWith(`${base}/users`)}      onClick={() => setIsMobileMenuOpen(false)} />
              <NavItem href={`${base}/menu`}       icon={<UtensilsCrossed className="w-4 h-4" aria-hidden="true" />} label="Menú"       active={pathname.startsWith(`${base}/menu`)}       onClick={() => setIsMobileMenuOpen(false)} />
              <NavItem href={`${base}/categories`} icon={<Tag className="w-4 h-4" aria-hidden="true" />}             label="Categorías" active={pathname.startsWith(`${base}/categories`)} onClick={() => setIsMobileMenuOpen(false)} />
              <NavItem href={`${base}/tables`}     icon={<TableProperties className="w-4 h-4" aria-hidden="true" />} label="Mesas"      active={pathname.startsWith(`${base}/tables`)}     onClick={() => setIsMobileMenuOpen(false)} />
              <NavItem href={`${base}/orders`}     icon={<ClipboardList className="w-4 h-4" aria-hidden="true" />}   label="Pedidos"    active={pathname.startsWith(`${base}/orders`)}     onClick={() => setIsMobileMenuOpen(false)} />
              <NavItem href={`${base}/inventory`}  icon={<Package className="w-4 h-4" aria-hidden="true" />}         label="Inventario" active={pathname.startsWith(`${base}/inventory`)}  onClick={() => setIsMobileMenuOpen(false)} />
              <NavItem href={`${base}/settings/branding`} icon={<Palette className="w-4 h-4" aria-hidden="true" />} label="Personalización" active={pathname.startsWith(`${base}/settings/branding`)} onClick={() => setIsMobileMenuOpen(false)} />
            </nav>
          </div>

          <div>
            <p className="px-3 text-xs font-bold text-foreground/30 mb-2 tracking-wider">REPORTES</p>
            <nav className="space-y-0.5">
              <NavItem href={`${base}/reports`} icon={<BarChart2 className="w-4 h-4" aria-hidden="true" />} label="Análisis de Ventas" active={pathname.startsWith(`${base}/reports`)} onClick={() => setIsMobileMenuOpen(false)} />
            </nav>
          </div>

          <div>
            <p className="px-3 text-xs font-bold text-foreground/30 mb-2 tracking-wider">CUENTA</p>
            <nav className="space-y-0.5">
              <NavItem href={`${base}/settings/profile`} icon={<Settings className="w-4 h-4" aria-hidden="true" />} label="Configuración" active={pathname.startsWith(`${base}/settings`)} onClick={() => setIsMobileMenuOpen(false)} />
            </nav>
          </div>
        </div>

        {/* User Profile & Sign Out */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <span className="text-xs font-bold text-foreground">{user?.email?.charAt(0).toUpperCase() || "U"}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-medium text-foreground truncate">{user?.email}</p>
              <p className="text-[10px] text-foreground/40 truncate">{user?.role}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start h-9 px-3 bg-transparent border-transparent hover:bg-white/5 text-foreground/60 hover:text-foreground"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
            <span className="text-sm">{isSigningOut ? "Cerrando…" : "Cerrar Sesión"}</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:pl-64 flex-1 flex flex-col min-h-screen">
        {/* Header with Breadcrumbs */}
        <header className="h-16 border-b border-white/5 flex items-center px-4 lg:px-8 bg-background/80 backdrop-blur-md sticky top-0 z-40">
          <button
            className="lg:hidden mr-3 p-2 rounded-md text-foreground/60 hover:text-foreground hover:bg-white/5 transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="flex items-center text-sm">
            <span className="text-foreground/60 hover:text-foreground cursor-pointer transition-colors">{title}</span>
            <ChevronRight className="w-4 h-4 mx-2 text-foreground/20" aria-hidden="true" />
            <span className="text-foreground font-medium">{subtitle}</span>
          </div>
          <div className="ml-auto">
            <AlertsPanel />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">{subtitle}</h1>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
    </RestaurantThemeProvider>
  );
}

function NavItem({ href, icon, label, active, onClick }: { href: string; icon: React.ReactNode; label: string; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
        active
          ? "bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/20"
          : "text-foreground/40 hover:bg-white/5 hover:text-foreground"
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </Link>
  );
}
