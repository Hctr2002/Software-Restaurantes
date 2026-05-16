"use client";
import React from "react";
import { cn } from "../../../lib/utils";

/**
 * Contenedor tipo card que respeta los colores de fondo y texto del tema.
 * // Función para heredar el color de card y el contraste de texto del tema.
 */
interface PortalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean; // Aplica un efecto de desenfoque si es true
}

export function PortalCard({ 
  glass = false, 
  className, 
  style,
  children, 
  ...props 
}: PortalCardProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground border border-foreground/10 rounded-2xl overflow-hidden",
        glass && "bg-card/95 backdrop-blur-xl",
        className
      )}
      // Garantiza que el texto dentro de la card use la fuente del cuerpo
      style={{ fontFamily: "var(--font-body)", ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
