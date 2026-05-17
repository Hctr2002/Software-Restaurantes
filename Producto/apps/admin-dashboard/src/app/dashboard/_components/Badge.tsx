"use client";

import React from "react";

/**
 * Variantes de color permitidas para el Badge.
 */
type BadgeVariant = "success" | "danger" | "warning" | "neutral" | "info";

/**
 * Props para el componente Badge.
 */
interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

/**
 * Componente Badge para mostrar estados o etiquetas.
 * Utiliza un diseño de "vidrio" (glassmorphism) sutil que se adapta al fondo del tema.
 * Se han mapeado variantes a variables semánticas (ej. info -> primary).
 */
export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  const baseClasses = "px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest inline-flex items-center justify-center transition-all";
  
  // Mapeo de variantes a clases de Tailwind con variables semánticas
  const variants = {
    success: "bg-success/10 text-success border border-success/20",
    danger: "bg-destructive/10 text-destructive border border-destructive/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    info: "bg-primary/10 text-primary border border-primary/20",
    neutral: "bg-muted/50 text-muted-foreground border border-border",
  };

  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
