"use client";

import { ClipboardList, Receipt, Loader2, ShoppingBag, ChevronRight, Bell } from "lucide-react";
import { TableRecord } from "@menu-bites/auth";
import { motion, AnimatePresence } from "framer-motion";

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
  if (!tableData || isCheckoutOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
      <div className="max-w-xl mx-auto flex flex-col gap-4 items-center">
        
        {/* Secondary Actions Row */}
        <AnimatePresence>
          {!isCheckoutOpen && cartCount === 0 && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="flex gap-2 sm:gap-3 pointer-events-auto"
            >
              {tableOrdersCount > 0 && (
                <button 
                  onClick={onOpenCuenta} 
                  className="bg-card flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-xl font-bold text-[10px] sm:text-xs uppercase tracking-wider text-foreground border border-white/10 hover:brightness-110 transition-all active:scale-95"
                  style={{ backgroundColor: 'hsl(var(--card))', opacity: 1 }}
                >
                  <ClipboardList className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  Cuenta
                  <span className="bg-primary/20 text-primary text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full">{tableOrdersCount}</span>
                </button>
              )}

              <button 
                onClick={onConfirmBill} 
                disabled={isRequestingBill || billRequested} 
                className={`bg-card flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-xl font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-all active:scale-95 border border-white/10 ${
                  billRequested ? 'text-emerald-500 border-emerald-500/30' : 'text-foreground'
                }`}
                style={{ backgroundColor: 'hsl(var(--card))', opacity: 1 }}
              >
                {isRequestingBill ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <Receipt className={`w-3 h-3 sm:w-4 sm:h-4 ${billRequested ? 'text-emerald-500' : 'text-primary'}`} />}
                {billRequested ? '✓' : 'Cobro'}
              </button>

              <button 
                onClick={() => (window as any).handleCallWaiter?.()} 
                className="bg-card flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-xl font-bold text-[10px] sm:text-xs uppercase tracking-wider text-primary border border-primary/20 hover:bg-primary/10 transition-all active:scale-95"
                style={{ backgroundColor: 'hsl(var(--card))', opacity: 1 }}
              >
                <Bell className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
                Garzón
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Action (Checkout) */}
        <AnimatePresence>
          {cartCount > 0 && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full pointer-events-auto"
            >
              <button 
                onClick={onOpenCheckout} 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 sm:py-5 px-5 sm:px-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-primary/40 flex justify-between items-center transition-all active:scale-[0.98] group overflow-hidden relative"
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <div className="flex items-center gap-2 sm:gap-4 relative z-10">
                  <div className="bg-primary-foreground/20 backdrop-blur-md text-primary-foreground w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-base sm:text-lg">{cartCount}</div>
                  <div className="text-left">
                    <span className="block text-[8px] sm:text-[10px] uppercase font-black tracking-[0.2em] opacity-70 leading-none mb-0.5 sm:mb-1">Tu Pedido</span>
                    <span className="font-black text-sm sm:text-xl italic tracking-tight">Confirmar Orden</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                  <div className="text-right">
                    <span className="block text-[8px] sm:text-[10px] uppercase font-black tracking-[0.2em] opacity-70 leading-none mb-0.5 sm:mb-1">Total</span>
                    <span className="font-black text-lg sm:text-2xl italic tracking-tighter">${cartTotal.toLocaleString()}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
