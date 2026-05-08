"use client";

import { ClipboardList, Receipt, Loader2, ShoppingBag, ChevronRight, Bell } from "lucide-react";
import { TableRecord } from "@menu-bites/auth";

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
    <>
      {tableOrdersCount > 0 && (
        <div className="fixed bottom-8 left-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
          <button 
            onClick={onOpenCuenta} 
            className="flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl font-bold text-sm bg-navy-light border border-sand/10 text-sand hover:bg-sand/10 transition-all active:scale-95"
          >
            <ClipboardList className="w-4 h-4 text-sage" aria-hidden="true" />
            Mi Cuenta
            <span className="bg-sage/20 text-sage text-[10px] font-black px-1.5 py-0.5 rounded-full">{tableOrdersCount}</span>
          </button>
        </div>
      )}

      <div className="fixed bottom-8 right-6 z-50 flex flex-col gap-3 animate-in slide-in-from-bottom-10 fade-in duration-500">
        <button 
          onClick={onConfirmBill} 
          disabled={isRequestingBill || billRequested} 
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm transition-all active:scale-95 ${
            billRequested 
              ? 'bg-green-700/80 text-white cursor-default border border-green-500/30' 
              : 'bg-navy-light border border-sand/10 text-sand hover:bg-sand/10'
          }`}
        >
          {isRequestingBill ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Receipt className="w-4 h-4" aria-hidden="true" />}
          {billRequested ? 'Cuenta solicitada ✓' : 'Solicitar Cuenta'}
        </button>

        <button 
          onClick={() => (window as any).handleCallWaiter?.()} 
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl shadow-2xl font-black text-sm bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all active:scale-95"
        >
          <Bell className="w-4 h-4" />
          Llamar Garzón
        </button>
      </div>

      {cartCount > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
          <button 
            onClick={onOpenCheckout} 
            className="w-full bg-sage hover:bg-sage-light text-navy-dark py-4 px-6 rounded-2xl shadow-2xl shadow-sage/20 flex justify-between items-center transition-all active:scale-95 group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-navy-dark text-sand w-8 h-8 rounded-lg flex items-center justify-center font-bold">{cartCount}</div>
              <div className="text-left">
                <span className="block text-[10px] uppercase font-black tracking-widest opacity-60 leading-none">Mi Pedido</span>
                <span className="font-bold">Confirmar Orden</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg">${cartTotal.toLocaleString()}</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </div>
          </button>
        </div>
      )}
    </>
  );
}
