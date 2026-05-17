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

  // El tema ahora se maneja globalmente a través de AdminThemeWrapper y RestaurantThemeProvider.
  // Esto elimina la necesidad de manipular directamente el DOM para inyectar variables CSS.

  /**
   * NavContent define la estructura de navegación lateral (Sidebar).
   * Se utiliza tanto en la versión móvil como en la de escritorio para mantener la paridad.
   */
  const NavContent = () => (
    <>
      {/* Sección de Marca y Logo del Sistema */}
      <div className="h-24 flex items-center px-8 border-b border-border">
        <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center mr-3 shadow-lg shadow-primary/20">
          <Store className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-base font-black text-foreground tracking-tighter uppercase">Menu <span className="text-primary">Bites</span></h2>
          <p className="text-[9px] text-muted-foreground font-bold tracking-[0.2em] uppercase">Admin Hub</p>
        </div>
      </div>

      {/* Menú de Navegación Principal: Organizado por categorías semánticas */}
      <div className="flex-1 overflow-y-auto py-8 px-4 space-y-8 no-scrollbar">
        {/* Categoría: Resumen y Estadísticas */}
        <div>
          <p className="px-4 text-[10px] font-black text-muted-foreground/60 mb-4 tracking-[0.2em] uppercase">Principal</p>
          <nav className="space-y-1">
            <NavItem href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Resumen" active={pathname === "/dashboard"} />
          </nav>
        </div>

        {/* Categoría: Gestión de Entidades (Restaurantes y Usuarios) */}
        <div>
          <p className="px-4 text-[10px] font-black text-muted-foreground/60 mb-4 tracking-[0.2em] uppercase">Directorio</p>
          <nav className="space-y-1">
            <NavItem href="/dashboard/restaurants" icon={<Store className="w-4 h-4" />} label="Organizaciones" active={pathname.startsWith("/dashboard/restaurants")} />
            <NavItem href="/dashboard/users" icon={<Users className="w-4 h-4" />} label="Usuarios Globales" active={pathname.startsWith("/dashboard/users")} />
          </nav>
        </div>

        {/* Categoría: Configuración y Administración del Sistema */}
        <div>
          <p className="px-4 text-[10px] font-black text-muted-foreground/60 mb-4 tracking-[0.2em] uppercase">Sistema</p>
          <nav className="space-y-1">
            <NavItem href="/dashboard/settings/profile" icon={<Settings className="w-4 h-4" />} label="Configuración" active={pathname.startsWith("/dashboard/settings")} />
          </nav>
        </div>
      </div>

      {/* Sección Inferior: Perfil de Usuario y Control de Sesión */}
      {/* Contenedor inferior con fondo adaptativo sólido */}
      <div className="p-6 bg-muted/30 border-t border-border">
        <div className="flex items-center space-x-3 mb-6 px-2">
          {/* Avatar dinámico basado en la inicial del usuario */}
          <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center border border-border shadow-inner">
            <span className="text-xs font-black text-primary">{user?.email?.charAt(0).toUpperCase() || "U"}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[11px] font-bold text-foreground truncate">{user?.email}</p>
            <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest truncate">{user?.role}</p>
          </div>
        </div>
        
        {/* Botón de Cierre de Sesión con estilo sólido premium */}
        <Button
          variant="outline"
          className="w-full justify-start h-11 px-4 rounded-2xl bg-muted/50 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all duration-300 group"
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
      {/* Menú Móvil Lateral (Deslizable) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Fondo desenfocado para enfoque en el menú */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/80 z-[60] lg:hidden"
            />
            {/* Menú lateral móvil con fondo sólido premium */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border z-[70] lg:hidden flex flex-col overflow-hidden shadow-2xl"
            >
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Barra Lateral de Escritorio: Utiliza un diseño de tarjeta sólida premium */}
      <aside className="fixed left-6 top-6 bottom-6 w-64 bg-card border border-border rounded-[2.5rem] z-50 hidden lg:flex flex-col overflow-hidden shadow-2xl shadow-black/10">
        <NavContent />
      </aside>
 
      {/* Contenedor de Contenido Principal: Ajusta el padding según la barra lateral lateral fija */}
      <main className="lg:pl-[19rem] flex-1 flex flex-col min-h-screen pr-0 lg:pr-6">
        {/* Barra de Navegación Superior (Navbar) con Breadcrumbs y Menú Móvil */}
        <header className="h-20 flex items-center px-4 lg:px-8 sticky top-0 z-40 bg-background lg:bg-transparent">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden mr-4 text-foreground hover:bg-muted"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <LayoutDashboard className="w-6 h-6" />
          </Button>

          {/* Indicador de Ubicación (Breadcrumbs) */}
          <div className="bg-card border border-border px-4 lg:px-6 py-2 rounded-2xl flex items-center text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-black/10">
            <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors hidden sm:inline">{title}</span>
            <ChevronRight className="w-3 h-3 mx-3 text-muted-foreground/40 hidden sm:inline" />
            <span className="text-foreground truncate max-w-[150px] sm:max-w-none">{subtitle}</span>
          </div>
        </header>

        {/* Sección de Contenido Dinámico con transiciones suaves entre páginas */}
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
              {/* Encabezado Principal de la Página */}
              <div className="flex flex-col space-y-1 mb-10">
                <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">{subtitle}</h1>
                <div className="h-1.5 w-12 bg-primary rounded-full shadow-lg shadow-primary/20" />
              </div>
              
              {/* Inyección del contenido de la página hijo */}
              {children}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/**
 * NavItem: Componente funcional para los enlaces de la barra lateral.
 * Implementa lógica de herencia de color del tema (bg-primary/10) para un diseño sutil y premium.
 */
function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <div>
      <Link
        href={href}
        className={`relative w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
          active
            ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        {/* Icono animado: Hereda el color primario cuando está activo */}
        <div className={`transition-transform duration-300 ${active ? "scale-110 text-primary" : "group-hover:scale-110"}`}>
          {icon}
        </div>
        
        {/* Etiqueta de texto: Configurada con tracking-widest para una estética limpia */}
        <span className={`text-[11px] font-bold uppercase tracking-widest ${active ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}>
          {label}
        </span>

        {/* Indicador visual lateral para resaltar la selección activa */}
        {active && (
          <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
        )}
      </Link>
    </div>
  );
}
