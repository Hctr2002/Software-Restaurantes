"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../../lib/utils";

/**
 * Botón principal del portal que respeta los colores semánticos del tema.
 * // Función para heredar el color primario y fuente del tema en botones con animaciones premium.
 */
interface PortalPrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "ghost" | "flat" | "success";
  size?: "sm" | "md" | "lg" | "icon";
  font?: "body" | "title" | "accent"; // Permite elegir qué fuente del tema usar
}

export function PortalPrimaryButton({
  loading = false,
  variant = "primary",
  size = "md",
  font = "body",
  className,
  style,
  children,
  disabled,
  ...props
}: PortalPrimaryButtonProps) {
  // Clases semánticas basadas en las variables CSS inyectadas
  const variantStyles = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25",
    ghost:   "bg-card text-foreground border border-border hover:bg-muted",
    flat:    "bg-transparent text-foreground border-0 hover:bg-foreground/5",
    success: "bg-success/15 text-success border border-success/40 hover:bg-success/25",
  };

  const sizeStyles = {
    sm:   "py-2 px-4 text-xs rounded-xl",
    md:   "py-3 px-6 text-sm rounded-2xl",
    lg:   "py-4 px-8 text-base rounded-3xl",
    icon: "p-2 w-10 h-10 flex items-center justify-center rounded-xl",
  };

  // Función para resolver el stack de fuente dinámico basado en la selección
  const getFontStack = () => {
    switch (font) {
      case "title": return "var(--font-title)";
      case "accent": return "var(--font-accent)";
      default: return "var(--font-body)";
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={loading || disabled}
      className={cn(
        "flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      // Función para heredar la fuente seleccionada y permitir personalización externa
      style={{ fontFamily: getFontStack(), ...style }}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
