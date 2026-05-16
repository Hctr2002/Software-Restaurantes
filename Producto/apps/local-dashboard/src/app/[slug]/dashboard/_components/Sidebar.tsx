"use client";

import { Store, LayoutDashboard, Users, UtensilsCrossed, Tag, TableProperties, ClipboardList, Package, Palette, BarChart2, LogOut, X } from "lucide-react";
import { Button } from "@menu-bites/ui";
import { NavItem } from "./NavItem";

interface SidebarProps {
  user: any;
  pathname: string;
  base: string;
  isSigningOut: boolean;
  onSignOut: () => void;
  onCloseMobile?: () => void;
}

export default function Sidebar({ user, pathname, base, isSigningOut, onSignOut, onCloseMobile }: SidebarProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sección de Marca: Muestra el logo y el nombre del sistema con el color primario dinámico */}
      <div className="h-24 flex items-center px-8 border-b border-border shrink-0">
        <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center mr-3 shadow-lg shadow-primary/20">
          <Store className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-black text-foreground tracking-tighter uppercase italic">Menu <span className="text-primary">Bites</span></h2>
          <p className="text-[9px] text-foreground/40 font-bold tracking-[0.2em] uppercase">Local Hub</p>
        </div>
        {onCloseMobile && (
          <button
            className="lg:hidden p-2 rounded-xl text-foreground/40 hover:text-foreground hover:bg-muted transition-colors"
            onClick={onCloseMobile}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navegación Principal: Organizada por categorías para mejorar la UX y mantenibilidad */}
      <div className="flex-1 overflow-y-auto py-8 px-4 space-y-8 no-scrollbar">
        <div>
          <p className="px-4 text-[10px] font-black text-foreground/30 mb-4 tracking-[0.2em] uppercase" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Principal</p>
          <nav className="space-y-1">
            <NavItem href={base} icon={<LayoutDashboard className="w-4 h-4" />} label="Resumen" active={pathname === base} onClick={onCloseMobile} />
          </nav>
        </div>

        <div>
          <p className="px-4 text-[10px] font-black text-foreground/30 mb-4 tracking-[0.2em] uppercase" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Gestión</p>
          <nav className="space-y-1">
            <NavItem href={`${base}/users`}      icon={<Users className="w-4 h-4" />}           label="Usuarios"   active={pathname.startsWith(`${base}/users`)}      onClick={onCloseMobile} />
            <NavItem href={`${base}/menu`}       icon={<UtensilsCrossed className="w-4 h-4" />} label="Menú"       active={pathname.startsWith(`${base}/menu`)}       onClick={onCloseMobile} />
            <NavItem href={`${base}/categories`} icon={<Tag className="w-4 h-4" />}             label="Categorías" active={pathname.startsWith(`${base}/categories`)} onClick={onCloseMobile} />
            <NavItem href={`${base}/tables`}     icon={<TableProperties className="w-4 h-4" />} label="Mesas"      active={pathname.startsWith(`${base}/tables`)}     onClick={onCloseMobile} />
            <NavItem href={`${base}/orders`}     icon={<ClipboardList className="w-4 h-4" />}   label="Pedidos"    active={pathname.startsWith(`${base}/orders`)}     onClick={onCloseMobile} />
            <NavItem href={`${base}/inventory`}  icon={<Package className="w-4 h-4" />}         label="Inventario" active={pathname.startsWith(`${base}/inventory`)}  onClick={onCloseMobile} />
            <NavItem href={`${base}/settings/branding`} icon={<Palette className="w-4 h-4" />} label="Branding"   active={pathname.startsWith(`${base}/settings/branding`)} onClick={onCloseMobile} />
          </nav>
        </div>

        <div>
          <p className="px-4 text-[10px] font-black text-foreground/30 mb-4 tracking-[0.2em] uppercase" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Análisis</p>
          <nav className="space-y-1">
            <NavItem href={`${base}/reports`} icon={<BarChart2 className="w-4 h-4" />} label="Reportes" active={pathname.startsWith(`${base}/reports`)} onClick={onCloseMobile} />
          </nav>
        </div>
      </div>

      {/* Perfil de Usuario y Cierre de Sesión: Integrado con el sistema de autenticación centralizado */}
      <div className="p-6 bg-card border-t border-border mt-auto">
        <div className="flex items-center space-x-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-2xl bg-background flex items-center justify-center border border-border shadow-inner">
            <span className="text-xs font-black text-primary">{user?.email?.charAt(0).toUpperCase() || "U"}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[11px] font-bold text-foreground truncate">{user?.email}</p>
            <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest truncate">{user?.role}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start h-11 px-4 rounded-2xl bg-background border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all duration-300 group"
          onClick={onSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">{isSigningOut ? "Saliendo..." : "Cerrar Sesión"}</span>
        </Button>
      </div>
    </div>
  );
}
