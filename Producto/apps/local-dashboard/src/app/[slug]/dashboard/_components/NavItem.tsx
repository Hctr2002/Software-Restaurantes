"use client";

import React from "react";
import Link from "next/link";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}

export function NavItem({ href, icon, label, active, onClick }: NavItemProps) {
  return (
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
      <span 
        className={`text-[11px] font-bold uppercase tracking-widest ${active ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`} 
        style={{ fontFamily: 'var(--font-accent)' }}
      >
        {label}
      </span>
      {active && (
        <div className="absolute right-4 w-1.5 h-1.5 bg-primary-foreground rounded-full" />
      )}
    </Link>
  );
}
