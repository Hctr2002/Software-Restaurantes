"use client";

import { ShoppingBag, MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { TableRecord } from "@menu-bites/auth";

interface CheckoutModalProps {
  cart: any[];
  cartTotal: number;
  table: {
    input: string;
    data: TableRecord | null;
    loading: boolean;
    error: string | null;
    orderError?: string | null;
  };
  onTableInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPlaceOrder: () => void;
  onClose: () => void;
  placing: boolean;
}

export function CheckoutModal({ 
  cart, 
  cartTotal, 
  table, 
  onTableInputChange, 
  onPlaceOrder, 
  onClose, 
  placing 
}: CheckoutModalProps) {
  return (
    <div className="fixed inset-0 z-[60] animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-navy-dark/80 backdrop-blur-md" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 glass-panel rounded-t-[2.5rem] p-8 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-500">
        <div className="w-12 h-1.5 bg-sand/10 rounded-full mx-auto mb-8" />
        <h2 className="text-2xl font-bold text-sand mb-6 flex items-center gap-3">
          <ShoppingBag className="text-sage" aria-hidden="true" />
          Detalle de su Pedido
        </h2>

        <div className="space-y-4 mb-8">
          {cart.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center py-3 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-sage/10 flex items-center justify-center text-sage font-bold text-sm">{item.quantity}x</div>
                <div>
                  <h4 className="text-sand font-medium">{item.name}</h4>
                  <p className="text-xs text-sand/40">${item.price.toLocaleString()}</p>
                </div>
              </div>
              <span className="text-sand font-bold">${(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <label htmlFor="table_input" className="flex items-center gap-2 mb-3 text-sand font-bold">
            <MapPin className="w-4 h-4 text-sage" aria-hidden="true" />
            Número de mesa
            <span className="text-accent text-lg leading-none" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <input 
              id="table_input" 
              type="text" 
              inputMode="numeric" 
              pattern="[0-9]*" 
              placeholder="Ej: 5" 
              value={table.input} 
              onChange={onTableInputChange} 
              maxLength={3} 
              className={`w-full bg-navy-light/40 border rounded-2xl px-5 py-4 text-sand text-2xl font-black text-center tracking-widest outline-none transition-all duration-300 ${
                table.data ? 'border-sage bg-sage/10 text-sage' : table.error ? 'border-red-500/60 bg-red-500/5' : 'border-white/10 focus:border-sage/50'
              }`} 
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {table.loading && <Loader2 className="w-5 h-5 text-sage animate-spin" aria-hidden="true" />}
              {!table.loading && table.data && <CheckCircle2 className="w-5 h-5 text-sage animate-in zoom-in" aria-hidden="true" />}
              {!table.loading && table.error && <AlertCircle className="w-5 h-5 text-red-400 animate-in zoom-in" aria-hidden="true" />}
            </div>
          </div>
          {table.data && <p className="text-sage text-sm mt-2 flex items-center gap-1 animate-in fade-in"><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Mesa {table.data.number} verificada ✓</p>}
          {table.error && <p className="text-red-400 text-sm mt-2 flex items-center gap-1 animate-in fade-in"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" /> {table.error}</p>}
        </div>

        <div className="bg-navy-light/30 rounded-2xl p-6 mb-8 border border-white/5">
          <div className="flex justify-between items-center mb-2"><span className="text-sand/60">Subtotal</span><span className="text-sand font-medium">${cartTotal.toLocaleString()}</span></div>
          {table.data && <div className="flex justify-between items-center mb-2"><span className="text-sand/60">Mesa</span><span className="text-sage font-semibold">#{table.data.number}</span></div>}
          <div className="flex justify-between items-center pt-4 border-t border-white/10"><span className="text-sand font-bold text-lg">Total</span><span className="text-sage font-black text-2xl">${cartTotal.toLocaleString()}</span></div>
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
          className="w-full bg-sage hover:bg-sage-light disabled:opacity-40 disabled:cursor-not-allowed text-navy-dark py-4 px-6 rounded-2xl shadow-xl shadow-sage/20 font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          {placing ? <><Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" /> Procesando…</> : <>Confirmar Pedido</>}
        </button>
        <button onClick={onClose} className="w-full mt-4 text-sand/40 hover:text-sand/60 font-medium py-2 transition-colors">Continuar comprando</button>
      </div>
    </div>
  );
}
