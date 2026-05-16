"use client";
import React from "react";
import { cn } from "../../../lib/utils";

/**
 * Primitivo para encabezados del portal (h1-h6).
 * // Función para heredar el tipo de letra del título definido en el tema dinámico.
 */
type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface PortalHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingLevel;
  accent?: boolean; // Si es true, usa el color primario del tema
  font?: "title" | "accent"; // Permite elegir qué fuente del tema usar
}

export function PortalHeading({
  as: Tag = "h2",
  accent = false,
  font = "title",
  className,
  style,
  children,
  ...props
}: PortalHeadingProps) {
  return (
    <Tag
      className={cn(accent && "text-primary", className)}
      // Función para heredar dinámicamente la fuente seleccionada del tema
      style={{ 
        fontFamily: font === "accent" ? "var(--font-accent)" : "var(--font-title)", 
        ...style 
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}
