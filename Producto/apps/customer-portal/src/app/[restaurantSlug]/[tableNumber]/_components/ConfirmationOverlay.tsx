"use client";

import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { TableRecord } from "@menu-bites/auth";
import { PortalHeading, PortalText, PortalPrimaryButton } from "@menu-bites/ui";

interface ConfirmationOverlayProps {
  show: boolean;
  tableData: TableRecord | null;
  restaurantName: string;
  onClose: () => void;
}

/**
 * Pantalla de confirmación tras realizar un pedido con éxito.
 * // Función para heredar el tema dinámico en la pantalla de éxito y mostrar feedback visual premium.
 */
export function ConfirmationOverlay({ show, tableData, restaurantName, onClose }: ConfirmationOverlayProps) {
  // Función para evitar el renderizado si la pantalla no debe mostrarse
  if (!show) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 text-center bg-background"
    >
      <motion.div 
        initial={{ scale: 0.5, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="bg-card p-10 sm:p-16 rounded-[3rem] sm:rounded-[4rem] border border-border flex flex-col items-center max-w-sm sm:max-w-md w-full shadow-2xl shadow-primary/20"
      >
        {/* // Función para mostrar el icono animado de éxito con efectos de brillo */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] bg-primary flex items-center justify-center mb-6 sm:mb-8 shadow-2xl shadow-primary/40 relative">
          <div className="absolute inset-0 bg-primary-foreground/20 rounded-[2rem] animate-ping opacity-20" />
          <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-primary-foreground relative z-10" />
        </div>
        
        {/* // Función para mostrar el título dinámico con la fuente de encabezado del tema */}
        <PortalHeading as="h2" className="text-2xl sm:text-4xl font-black text-foreground mb-4 italic uppercase tracking-tighter leading-none">
          ¡Pedido<br /><span className="text-primary">Enviado!</span>
        </PortalHeading>
        
        {/* // Función para mostrar el texto descriptivo del estado del pedido */}
        <PortalText className="text-sm sm:text-base text-foreground/60 font-bold mb-2 tracking-tight leading-relaxed">
          Estamos preparando todo. En breve confirmaremos tu orden.
        </PortalText>
        
        {/* // Función para mostrar la información de la mesa y el restaurante */}
        {tableData && (
          <div className="bg-muted/30 px-4 py-2 rounded-xl mb-8 sm:mb-12 border border-border">
            <PortalText as="span" font="accent" className="text-[10px] sm:text-xs font-black text-primary/60 uppercase tracking-[0.2em]">
              Mesa #{tableData.number} · {restaurantName}
            </PortalText>
          </div>
        )}
        
        {/* // Función para permitir al usuario volver a la navegación del menú */}
        <PortalPrimaryButton 
          variant="ghost"
          onClick={onClose} 
          className="w-full py-4 sm:py-5 rounded-2xl sm:rounded-3xl text-xs sm:text-sm font-black uppercase tracking-[0.2em] transition-all"
        >
          Volver al Menú
        </PortalPrimaryButton>
      </motion.div>
    </motion.div>
  );
}
