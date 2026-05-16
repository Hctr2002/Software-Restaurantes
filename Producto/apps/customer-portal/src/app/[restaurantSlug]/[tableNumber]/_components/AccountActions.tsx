"use client";

import { ClipboardList, Receipt, Loader2, ChevronRight, Bell } from "lucide-react";
import { TableRecord } from "@menu-bites/auth";
import { motion, AnimatePresence } from "framer-motion";
import { cn, PortalPrimaryButton, PortalText } from "@menu-bites/ui";

/**
 * Propiedades del componente AccountActions.
 */
interface AccountActionsProps {
  tableData: TableRecord | null;
  tableOrdersCount: number;
  cartCount: number;
  cartTotal: number;
  billRequested: boolean;
  isRequestingBill: boolean;
  isCheckoutOpen: boolean;
  onOpenCuenta: () => void;
  onOpenCheckout: () => void;
  onConfirmBill: () => void;
}

/**
 * Componente que muestra las acciones rápidas del cliente (Cuenta, Cobro, Garzón, Checkout).
 * // Función para heredar las acciones de la cuenta y sincronizar botones con el tema dinámico.
 */
export function AccountActions({
  tableData,
  tableOrdersCount,
  cartCount,
  cartTotal,
  billRequested,
  isRequestingBill,
  isCheckoutOpen,
  onOpenCuenta,
  onOpenCheckout,
  onConfirmBill
}: AccountActionsProps) {
  // Función para ocultar acciones si no hay mesa activa o el checkout está abierto
  if (!tableData || isCheckoutOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
      <div className="max-w-xl mx-auto flex flex-col gap-4 items-center">
        
        {/* Fila de Acciones Secundarias (Cuenta, Cobro, Garzón) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex gap-2 sm:gap-3 pointer-events-auto"
        >
          {/* // Función para visualizar el resumen de la cuenta del cliente */}
          {tableOrdersCount > 0 && (
            <PortalPrimaryButton 
              variant="ghost"
              onClick={onOpenCuenta} 
              className="px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-xl font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-all"
            >
              <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <PortalText as="span" className="hidden xs:inline">Cuenta</PortalText>
              {/* Indicador visual de la cantidad de pedidos realizados con herencia de fuente */}
              <PortalText as="span" className="bg-primary/20 text-primary text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {tableOrdersCount}
              </PortalText>
            </PortalPrimaryButton>
          )}

          {/* // Función para solicitar el cobro de la cuenta al personal */}
          <PortalPrimaryButton 
            variant={billRequested ? "success" : "ghost"}
            onClick={onConfirmBill} 
            disabled={isRequestingBill || billRequested} 
            className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-xl font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-all"
          >
            {isRequestingBill ? (
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <Receipt className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", billRequested ? "text-success" : "text-primary")} />
            )}
            <PortalText as="span">{billRequested ? '✓ Cobro' : 'Cobro'}</PortalText>
          </PortalPrimaryButton>

          {/* // Función para solicitar asistencia de un garzón a la mesa */}
          <PortalPrimaryButton 
            variant="ghost"
            onClick={() => (window as any).handleCallWaiter?.()} 
            className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-xl font-bold text-[10px] sm:text-xs uppercase tracking-wider text-primary border-primary/20 hover:bg-primary/10 transition-all"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
            <PortalText as="span">Garzón</PortalText>
          </PortalPrimaryButton>
        </motion.div>

        {/* Acción Principal: Confirmar Orden (Checkout) */}
        <AnimatePresence>
          {cartCount > 0 && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full pointer-events-auto"
            >
              {/* // Función para abrir el modal de checkout utilizando el botón primario del tema */}
              <PortalPrimaryButton 
                onClick={onOpenCheckout} 
                className="w-full py-4 sm:py-5 px-6 sm:px-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-primary/40 flex justify-between items-center group overflow-hidden relative h-auto"
              >
                {/* // Función para aplicar el efecto de brillo animado en la acción principal */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-primary-foreground/20 to-transparent pointer-events-none"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Lado izquierdo: Resumen de cantidades con herencia de fuente de acento */}
                <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                  <PortalText 
                    className="bg-primary-foreground/30 text-primary-foreground w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl"
                    font="accent"
                  >
                    {cartCount}
                  </PortalText>
                  <div className="text-left">
                    <PortalText className="block text-[9px] sm:text-[10px] uppercase font-black tracking-[0.2em] opacity-80 leading-none mb-1">Tu Pedido</PortalText>
                    <PortalText className="font-black text-base sm:text-xl italic tracking-tight uppercase">Confirmar Orden</PortalText>
                  </div>
                </div>

                {/* Lado derecho: Monto Total acumulado con fuente de acento heredada */}
                <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                  <div className="text-right">
                    <PortalText className="block text-[9px] sm:text-[10px] uppercase font-black tracking-[0.2em] opacity-80 leading-none mb-1">Total</PortalText>
                    <PortalText 
                      className="font-black text-xl sm:text-2xl italic tracking-tighter"
                      font="accent"
                    >
                      ${cartTotal.toLocaleString()}
                    </PortalText>
                  </div>
                  <ChevronRight className="w-6 h-6 sm:w-7 h-7 group-hover:translate-x-1 transition-transform" />
                </div>
              </PortalPrimaryButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
