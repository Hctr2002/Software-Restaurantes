"use client";

import React from "react";
import { Menu as MenuIcon, ChevronRight } from "lucide-react";
import AlertsPanel from "./AlertsPanel";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  onOpenMobileMenu: () => void;
}

export default function DashboardHeader({ title, subtitle, onOpenMobileMenu }: DashboardHeaderProps) {
  return (
    <header className="h-20 flex items-center px-4 lg:px-8 sticky top-0 z-40 bg-background/50 backdrop-blur-md lg:bg-transparent">
      <button
        className="lg:hidden mr-4 p-2.5 rounded-xl glass text-foreground/60 hover:text-primary transition-colors"
        onClick={onOpenMobileMenu}
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
  );
}
