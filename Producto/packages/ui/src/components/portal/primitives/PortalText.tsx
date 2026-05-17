"use client";
import React from "react";
import { cn } from "../../../lib/utils";

/**
 * Primitivo para textos base del portal (p, span, label).
 * // Función para heredar el tipo de letra del cuerpo definido en el tema dinámico.
 */
interface PortalTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: "p" | "span" | "label" | "small";
  muted?: boolean; // Si es true, usa una opacidad reducida del color de texto
  font?: "body" | "accent"; // Permite elegir qué fuente del tema usar
}

export function PortalText({
  as: Tag = "p",
  muted = false,
  font = "body",
  className,
  style,
  children,
  ...props
}: PortalTextProps) {
  return (
    <Tag
      className={cn(muted && "text-foreground/40", className)}
      // Función para heredar dinámicamente la fuente seleccionada del tema
      style={{ 
        fontFamily: font === "accent" ? "var(--font-accent)" : "var(--font-body)", 
        ...style 
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}
