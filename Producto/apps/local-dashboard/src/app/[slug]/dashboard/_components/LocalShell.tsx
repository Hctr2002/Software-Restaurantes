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
  Menu as MenuIcon,
  X,
  Package,
  Palette,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
 
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

  const NavContent = () => (
    <>
      {/* Brand */}
      <div className="h-24 flex items-center px-8 border-b border-white/5">
        <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center mr-3 shadow-lg shadow-primary/20">
          <Store className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-black text-foreground tracking-tighter uppercase italic">Menu <span className="text-primary">Bites</span></h2>
          <p className="text-[9px] text-foreground/40 font-bold tracking-[0.2em] uppercase">Local Hub</p>
        </div>
        <button
          className="lg:hidden p-2 rounded-xl text-foreground/40 hover:text-foreground hover:bg-white/5 transition-colors"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-8 px-4 space-y-8 no-scrollbar">
        <div>
          <p className="px-4 text-[10px] font-black text-foreground/30 mb-4 tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-accent)' }}>Principal</p>
          <nav className="space-y-1">
            <NavItem href={base} icon={<LayoutDashboard className="w-4 h-4" />} label="Resumen" active={pathname === base} onClick={() => setIsMobileMenuOpen(false)} />
          </nav>
        </div>

        <div>
          <p className="px-4 text-[10px] font-black text-foreground/30 mb-4 tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-accent)' }}>Gestión</p>
          <nav className="space-y-1">
            <NavItem href={`${base}/users`}      icon={<Users className="w-4 h-4" />}           label="Usuarios"   active={pathname.startsWith(`${base}/users`)}      onClick={() => setIsMobileMenuOpen(false)} />
            <NavItem href={`${base}/menu`}       icon={<UtensilsCrossed className="w-4 h-4" />} label="Menú"       active={pathname.startsWith(`${base}/menu`)}       onClick={() => setIsMobileMenuOpen(false)} />
            <NavItem href={`${base}/categories`} icon={<Tag className="w-4 h-4" />}             label="Categorías" active={pathname.startsWith(`${base}/categories`)} onClick={() => setIsMobileMenuOpen(false)} />
            <NavItem href={`${base}/tables`}     icon={<TableProperties className="w-4 h-4" />} label="Mesas"      active={pathname.startsWith(`${base}/tables`)}     onClick={() => setIsMobileMenuOpen(false)} />
            <NavItem href={`${base}/orders`}     icon={<ClipboardList className="w-4 h-4" />}   label="Pedidos"    active={pathname.startsWith(`${base}/orders`)}     onClick={() => setIsMobileMenuOpen(false)} />
            <NavItem href={`${base}/inventory`}  icon={<Package className="w-4 h-4" />}         label="Inventario" active={pathname.startsWith(`${base}/inventory`)}  onClick={() => setIsMobileMenuOpen(false)} />
            <NavItem href={`${base}/settings/branding`} icon={<Palette className="w-4 h-4" />} label="Branding"   active={pathname.startsWith(`${base}/settings/branding`)} onClick={() => setIsMobileMenuOpen(false)} />
          </nav>
        </div>

        <div>
          <p className="px-4 text-[10px] font-black text-foreground/30 mb-4 tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-accent)' }}>Análisis</p>
          <nav className="space-y-1">
            <NavItem href={`${base}/reports`} icon={<BarChart2 className="w-4 h-4" />} label="Reportes" active={pathname.startsWith(`${base}/reports`)} onClick={() => setIsMobileMenuOpen(false)} />
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
    <RestaurantThemeProvider theme={theme} isGlobal={true}>
      <div className="min-h-screen wow-gradient text-foreground font-sans flex transition-colors duration-500 overflow-x-hidden">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 bottom-0 w-72 bg-background/95 backdrop-blur-2xl border-r border-white/10 z-[70] lg:hidden flex flex-col overflow-hidden shadow-2xl"
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
          <header className="h-20 flex items-center px-4 lg:px-8 sticky top-0 z-40 bg-background/50 backdrop-blur-md lg:bg-transparent">
            <button
              className="lg:hidden mr-4 p-2.5 rounded-xl glass text-foreground/60 hover:text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="glass px-4 lg:px-6 py-2 rounded-2xl flex items-center text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-black/20">
              <span className="text-foreground/50 hover:text-primary cursor-pointer transition-colors hidden sm:inline">{title}</span>
              <ChevronRight className="w-3 h-3 mx-3 text-foreground/20 hidden sm:inline" />
              <span className="text-foreground truncate max-w-[150px] sm:max-w-none">{subtitle}</span>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <AlertsPanel />
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
    </RestaurantThemeProvider>
  );
}
 
function NavItem({ href, icon, label, active, onClick }: { href: string; icon: React.ReactNode; label: string; active: boolean; onClick?: () => void }) {
  return (
    <div>
      <Link
        href={href}
        onClick={onClick}
        className={`relative w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
          active
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
            : "text-foreground/40 hover:bg-white/5 hover:text-foreground"
        }`}
      >
        <div className={`transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}>
          {icon}
        </div>
        <span className={`text-[11px] font-bold uppercase tracking-widest ${active ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`} style={{ fontFamily: 'var(--font-accent)' }}>
          {label}
        </span>
        {active && (
          <div className="absolute right-4 w-1.5 h-1.5 bg-primary-foreground rounded-full" />
        )}
      </Link>
    </div>
  );
}
