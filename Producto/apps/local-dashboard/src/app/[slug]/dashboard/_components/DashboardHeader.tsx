"use client";

import React from "react";
import { Menu as MenuIcon, ChevronRight, LayoutDashboard } from "lucide-react";
import { PremiumHeader } from "@menu-bites/ui";
import AlertsPanel from "./AlertsPanel";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  onOpenMobileMenu: () => void;
}

export default function DashboardHeader({ title, subtitle, onOpenMobileMenu }: DashboardHeaderProps) {
  return (
    <div className="p-4 lg:p-6">
      <PremiumHeader
        title={title}
        accentTitle={subtitle}
        icon={LayoutDashboard}
        statusLabel="Admin Station"
        statusSubLabel="Management Dashboard"
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
