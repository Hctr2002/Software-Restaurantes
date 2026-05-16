"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@menu-bites/ui";

/**
 * Props para el componente Modal.
 */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Componente Modal deslizable (Slide-over).
 * Se ha refactorizado para utilizar variables semánticas de Tailwind que heredan el branding
 * dinámico definido en el ThemeWrapper.
 */
export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  // Aseguramos que el componente esté montado para evitar errores de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // Función para bloquear el scroll del cuerpo cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Fondo oscurecido (Backdrop) con desenfoque */}
      <div 
        className={`fixed inset-0 bg-background/80 z-[100] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel deslizable lateral utilizando colores del tema sólido premium */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border z-[101] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">{title}</h2>
          {/* Botón de cierre heredando estilos de botón del sistema */}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Contenido principal con scroll interno */}
        <div className="flex-1 overflow-y-auto p-6 text-muted-foreground">
          {children}
        </div>

        {/* Pie de página para acciones (opcional) */}
        {footer && (
          <div className="px-6 py-4 border-t border-border bg-card flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
