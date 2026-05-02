"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import AlertsPanel from "./AlertsPanel";
import { useAuthStore } from "@menu-bites/store";
import { signOut } from "@menu-bites/auth";
import { Button } from "@menu-bites/ui";
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

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      clearAuth();
      window.location.href = process.env.NEXT_PUBLIC_AUTH_URL ?? '/';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans flex">
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3 shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-100 tracking-tight leading-tight">Menu Bites</h2>
            <p className="text-[10px] text-slate-400 font-medium">Panel Local</p>
          </div>
          <button
            className="lg:hidden p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
          <div>
            <p className="px-3 text-xs font-bold text-slate-500 mb-2 tracking-wider">PANEL PRINCIPAL</p>
            <nav className="space-y-0.5">
              <NavItem href={base} icon={<LayoutDashboard className="w-4 h-4" />} label="Resumen" active={pathname === base} onClick={() => setIsMobileMenuOpen(false)} />
            </nav>
          </div>

          <div>
            <p className="px-3 text-xs font-bold text-slate-500 mb-2 tracking-wider">GESTIÓN</p>
            <nav className="space-y-0.5">
              <NavItem href={`${base}/users`}      icon={<Users className="w-4 h-4" />}           label="Usuarios"   active={pathname.startsWith(`${base}/users`)}      onClick={() => setIsMobileMenuOpen(false)} />
              <NavItem href={`${base}/menu`}       icon={<UtensilsCrossed className="w-4 h-4" />} label="Menú"       active={pathname.startsWith(`${base}/menu`)}       onClick={() => setIsMobileMenuOpen(false)} />
              <NavItem href={`${base}/categories`} icon={<Tag className="w-4 h-4" />}             label="Categorías" active={pathname.startsWith(`${base}/categories`)} onClick={() => setIsMobileMenuOpen(false)} />
              <NavItem href={`${base}/tables`}     icon={<TableProperties className="w-4 h-4" />} label="Mesas"      active={pathname.startsWith(`${base}/tables`)}     onClick={() => setIsMobileMenuOpen(false)} />
              <NavItem href={`${base}/orders`}     icon={<ClipboardList className="w-4 h-4" />}   label="Pedidos"    active={pathname.startsWith(`${base}/orders`)}     onClick={() => setIsMobileMenuOpen(false)} />
              <NavItem href={`${base}/inventory`}  icon={<Package className="w-4 h-4" />}         label="Inventario" active={pathname.startsWith(`${base}/inventory`)}  onClick={() => setIsMobileMenuOpen(false)} />
            </nav>
          </div>

          <div>
            <p className="px-3 text-xs font-bold text-slate-500 mb-2 tracking-wider">REPORTES</p>
            <nav className="space-y-0.5">
              <NavItem href={`${base}/reports`} icon={<BarChart2 className="w-4 h-4" />} label="Análisis de Ventas" active={pathname.startsWith(`${base}/reports`)} onClick={() => setIsMobileMenuOpen(false)} />
            </nav>
          </div>

          <div>
            <p className="px-3 text-xs font-bold text-slate-500 mb-2 tracking-wider">CUENTA</p>
            <nav className="space-y-0.5">
              <NavItem href={`${base}/settings/profile`} icon={<Settings className="w-4 h-4" />} label="Configuración" active={pathname.startsWith(`${base}/settings`)} onClick={() => setIsMobileMenuOpen(false)} />
            </nav>
          </div>
        </div>

        {/* User Profile & Sign Out */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <span className="text-xs font-bold text-slate-300">{user?.email?.charAt(0).toUpperCase() || "U"}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.email}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.role}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start h-9 px-3 bg-transparent border-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="text-sm">{isSigningOut ? "Cerrando..." : "Cerrar Sesión"}</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:pl-64 flex-1 flex flex-col min-h-screen">
        {/* Header with Breadcrumbs */}
        <header className="h-16 border-b border-slate-800 flex items-center px-4 lg:px-8 bg-slate-950 sticky top-0 z-40">
          <button
            className="lg:hidden mr-3 p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center text-sm">
            <span className="text-slate-400 hover:text-slate-300 cursor-pointer transition-colors">{title}</span>
            <ChevronRight className="w-4 h-4 mx-2 text-slate-600" />
            <span className="text-slate-200 font-medium">{subtitle}</span>
          </div>
          <div className="ml-auto">
            <AlertsPanel />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">{subtitle}</h1>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, active, onClick }: { href: string; icon: React.ReactNode; label: string; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
        active
          ? "bg-blue-900/30 text-blue-400 font-medium"
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </Link>
  );
}
