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

/**
 * NavItem: Componente de enlace de navegación para el dashboard local.
 * Utiliza variables semánticas para asegurar que el color de la marca (primary) se herede correctamente.
 */
export function NavItem({ href, icon, label, active, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
        active
          ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
          : "text-foreground/40 hover:bg-foreground/5 hover:text-foreground"
      }`}
    >
      {/* Icono: Escala y cambia de color según el estado activo */}
      <div className={`transition-transform duration-300 ${active ? "scale-110 text-primary" : "group-hover:scale-110"}`}>
        {icon}
      </div>

      {/* Etiqueta de texto: Configurada con tracking-widest para una estética limpia y legible */}
      <span 
        className={`text-[11px] font-bold uppercase tracking-widest ${active ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`} 
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {label}
      </span>

      {/* Indicador visual de elemento activo: Pequeño punto que hereda el color primario */}
      {active && (
        <div className="absolute right-4 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
      )}
    </Link>
  );
}
