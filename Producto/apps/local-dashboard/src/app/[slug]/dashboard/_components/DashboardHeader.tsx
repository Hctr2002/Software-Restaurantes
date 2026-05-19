/**
 * DashboardHeader — Cabecera superior del dashboard con icono dinámico por ruta, título y panel de alertas.
 * Incluye el botón de menú móvil y el AlertsPanel para notificaciones en tiempo real.
 */
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { 
  Menu as MenuIcon, 
  LayoutDashboard, 
  Users, 
  UtensilsCrossed, 
  Tag, 
  TableProperties, 
  ClipboardList, 
  Package, 
  Palette, 
  BarChart2 
} from "lucide-react";
import { PremiumHeader } from "@menu-bites/ui";
import AlertsPanel from "./AlertsPanel";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  onOpenMobileMenu: () => void;
}

const getIconForPath = (path: string) => {
  // Extraemos la parte después de /dashboard/
  const parts = path.split('/dashboard/');
  if (parts.length < 2 || parts[1] === "") return LayoutDashboard;
  
  const subpath = parts[1];
  
  if (subpath.startsWith('users')) return Users;
  if (subpath.startsWith('menu')) return UtensilsCrossed;
  if (subpath.startsWith('categories')) return Tag;
  if (subpath.startsWith('tables')) return TableProperties;
  if (subpath.startsWith('orders')) return ClipboardList;
  if (subpath.startsWith('inventory')) return Package;
  if (subpath.startsWith('settings/branding')) return Palette;
  if (subpath.startsWith('reports')) return BarChart2;
  
  return LayoutDashboard;
};

export default function DashboardHeader({ title, subtitle, onOpenMobileMenu }: DashboardHeaderProps) {
  const pathname = usePathname();
  const Icon = getIconForPath(pathname);

  return (
    <div className="p-4 lg:p-6">
      <PremiumHeader
        title={title}
        accentTitle={subtitle}
        icon={Icon}
        statusLabel="Admin Station"
        statusSubLabel="Management Dashboard"
        actions={
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-3 rounded-2xl bg-card border border-border shadow-lg text-foreground/60 hover:text-primary transition-colors"
              onClick={onOpenMobileMenu}
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <AlertsPanel />
          </div>
        }
      />
    </div>
  );
}
