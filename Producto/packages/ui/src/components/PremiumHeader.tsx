"use client";

import React from "react";
import { cn } from "../lib/utils";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Propiedades del componente PremiumHeader.
 */
interface PremiumHeaderProps {
  title: string;
  accentTitle?: string;
  statusLabel?: string;
  statusSubLabel?: string;
  icon: LucideIcon;
  stats?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  variant?: "default" | "compact";
  isSolid?: boolean;
  className?: string;
}

/**
 * Header premium con soporte para temas dinámicos y animaciones.
 * // Función para heredar el encabezado premium y sincronizar la tipografía con el tema.
 */
export const PremiumHeader = ({
  title,
  accentTitle,
  statusLabel = "Live System",
  statusSubLabel,
  icon: Icon,
  stats,
  actions,
  children,
  className,
  variant = "default",
  isSolid = true
}: PremiumHeaderProps) => {
  const isCompact = variant === "compact";

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "bg-card border border-border transition-all duration-500",
        "relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)]",
        isCompact ? "rounded-[2rem] p-4 gap-4" : "rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 gap-4 sm:gap-6",
        "flex flex-row justify-between items-center",
        className
      )}
      // Inyectar fondo de card si es sólido
    >
      <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6 flex-1 min-w-0">
        {/* Contenedor del Icono con color primario del tema */}
        <div 
          className={cn(
            "flex items-center justify-center shadow-2xl shadow-primary/30 shrink-0 transition-all duration-500 hover:scale-110",
            "relative overflow-hidden",
            isCompact ? "w-12 h-12 rounded-2xl" : "w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-[1.25rem] sm:rounded-[2rem] lg:rounded-[2.5rem]"
          )}
          style={{ backgroundColor: 'hsl(var(--primary))' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
          <Icon className={cn("text-primary-foreground relative z-10", isCompact ? "w-6 h-6" : "w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10")} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Título Principal — Se fuerza la tipografía del tema vía style para evitar problemas de compilación de Tailwind v4 */}
          <h1 
            className={cn(
              "font-bold tracking-tight leading-tight pr-1 truncate",
              isCompact ? "text-base sm:text-xl" : "text-lg sm:text-2xl lg:text-3xl"
            )}
            style={{ fontFamily: 'var(--font-title)' }}
          >
            {title} {accentTitle && <span className="text-primary">{accentTitle}</span>}
          </h1>
          {/* Indicador de Estado */}
          <div className="flex items-center gap-1.5 sm:gap-3 text-[9px] sm:text-[10px] font-black text-foreground/40 uppercase tracking-[0.1em] sm:tracking-[0.3em] mt-0.5 overflow-hidden">
            <span className="flex items-center gap-1 text-success whitespace-nowrap shrink-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success/40 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              {statusLabel}
            </span>
            {statusSubLabel && (
              <div className="flex items-center gap-1 whitespace-nowrap shrink-0">
                <span className="opacity-30">•</span>
                <span>{statusSubLabel}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Área de Estadísticas y Acciones */}
      <div className="flex flex-row items-center gap-3 lg:gap-6 justify-end">
        {stats && (
          <div className="hidden sm:flex items-center divide-x divide-border px-4 py-2.5 bg-card rounded-[1.5rem] border border-border shadow-xl">
            {stats}
          </div>
        )}
        
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          {children}
        </div>
      </div>
    </motion.header>
  );
}

