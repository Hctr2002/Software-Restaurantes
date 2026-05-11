"use client";

import { ShoppingBag, MapPin, Loader2, AlertCircle } from "lucide-react";
import { TableRecord } from "@menu-bites/auth";

interface CheckoutModalProps {
  cart: any[];
  cartTotal: number;
  table: {
    data: TableRecord | null;
    orderError?: string | null;
  };
  onPlaceOrder: () => void;
  onClose: () => void;
  placing: boolean;
}

export function CheckoutModal({ 
  cart, 
  cartTotal, 
  table, 
  onPlaceOrder, 
  onClose, 
  placing 
}: CheckoutModalProps) {
  return (
    <div className="fixed inset-0 z-[60] animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-navy-dark/80 backdrop-blur-md" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[2.5rem] p-8 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-500 border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
        <div className="w-12 h-1.5 bg-sand/10 rounded-full mx-auto mb-8" />
        <h2 className="text-2xl font-bold text-sand mb-6 flex items-center gap-3">
          <ShoppingBag className="text-primary" aria-hidden="true" />
          Detalle de su Pedido
        </h2>

        <div className="space-y-4 mb-8">
          {cart.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center py-3 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{item.quantity}x</div>
                <div>
                  <h4 className="text-sand font-medium">{item.name}</h4>
                  <p className="text-xs text-sand/40">${item.price.toLocaleString()}</p>
                </div>
              </div>
              <span className="text-sand font-bold">${(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Info de Mesa Automática */}
        {table.data ? (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 flex items-center justify-between animate-in fade-in zoom-in">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h4 className="text-sand font-bold text-lg leading-tight">Ubicación Confirmada</h4>
                <p className="text-primary font-medium text-sm">Tu pedido llegará aquí.</p>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-[10px] uppercase font-black tracking-widest text-sand/40 mb-1">Mesa</span>
              <span className="text-3xl font-black italic text-primary tracking-tighter leading-none">#{table.data.number}</span>
            </div>
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-8 flex items-center gap-4 animate-in fade-in zoom-in">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div>
              <h4 className="text-sand font-bold text-sm leading-tight">Mesa no detectada</h4>
              <p className="text-red-400 font-medium text-xs mt-0.5">Escanea el código QR de tu mesa para continuar.</p>
            </div>
          </div>
        )}

        <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/5">
          <div className="flex justify-between items-center mb-2"><span className="text-sand/60">Subtotal</span><span className="text-sand font-medium">${cartTotal.toLocaleString()}</span></div>
          {table.data && <div className="flex justify-between items-center mb-2"><span className="text-sand/60">Mesa</span><span className="text-primary font-semibold">#{table.data.number}</span></div>}
          <div className="flex justify-between items-center pt-4 border-t border-white/10"><span className="text-sand font-bold text-lg">Total</span><span className="text-primary font-black text-2xl">${cartTotal.toLocaleString()}</span></div>
        </div>

        {/* Mensaje de Error de Pedido */}
        {table.orderError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm animate-in fade-in zoom-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-bold">{table.orderError}</p>
          </div>
        )}

        <button 
          disabled={placing || !table.data} 
          onClick={onPlaceOrder} 
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground py-4 px-6 rounded-2xl shadow-xl shadow-primary/20 font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          {placing ? <><Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" /> Procesando…</> : <>Confirmar Pedido</>}
        </button>
        <button onClick={onClose} className="w-full mt-4 text-sand/40 hover:text-sand/60 font-medium py-2 transition-colors">Continuar comprando</button>
      </div>
    </div>
  );
}
