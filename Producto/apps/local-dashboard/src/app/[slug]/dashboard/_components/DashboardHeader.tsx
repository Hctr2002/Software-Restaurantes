"use client";

import React from "react";
import Link from "next/link";
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
import { PremiumHeader, cn } from "@menu-bites/ui";
import AlertsPanel from "./AlertsPanel";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  pathname: string;
  base: string;
  onOpenMobileMenu: () => void;
}

export default function DashboardHeader({ title, subtitle, pathname, base, onOpenMobileMenu }: DashboardHeaderProps) {
  const navItems = [
    { href: base, icon: LayoutDashboard, label: "Resumen", active: pathname === base },
    { href: `${base}/users`, icon: Users, label: "Usuarios", active: pathname.startsWith(`${base}/users`) },
    { href: `${base}/menu`, icon: UtensilsCrossed, label: "Menú", active: pathname.startsWith(`${base}/menu`) },
    { href: `${base}/categories`, icon: Tag, label: "Categorías", active: pathname.startsWith(`${base}/categories`) },
    { href: `${base}/tables`, icon: TableProperties, label: "Mesas", active: pathname.startsWith(`${base}/tables`) },
    { href: `${base}/orders`, icon: ClipboardList, label: "Pedidos", active: pathname.startsWith(`${base}/orders`) },
    { href: `${base}/inventory`, icon: Package, label: "Inventario", active: pathname.startsWith(`${base}/inventory`) },
    { href: `${base}/settings/branding`, icon: Palette, label: "Branding", active: pathname.startsWith(`${base}/settings/branding`) },
    { href: `${base}/reports`, icon: BarChart2, label: "Reportes", active: pathname.startsWith(`${base}/reports`) },
  ];

  return (
    <div className="p-4 lg:p-6">
      <PremiumHeader
        title={title}
        accentTitle={subtitle}
        icon={LayoutDashboard}
        statusLabel="Admin Station"
        statusSubLabel="Management Dashboard"
        stats={
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "p-2.5 rounded-xl transition-all duration-300 relative group",
                    item.active 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                      : "text-foreground/40 hover:bg-white/10 hover:text-foreground"
                  )}
                  title={item.label}
                >
                  <Icon className={cn("w-4 h-4", item.active ? "scale-110" : "group-hover:scale-110")} />
                  {item.active && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-foreground rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        }
        actions={
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-3 rounded-2xl glass text-foreground/60 hover:text-primary transition-colors"
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
