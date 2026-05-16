"use client";

import { ShoppingBag, MapPin, Loader2, AlertCircle } from "lucide-react";
import { TableRecord } from "@menu-bites/auth";
import { PortalHeading, PortalText, PortalPrimaryButton } from "@menu-bites/ui";

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

/**
 * Modal de confirmación de pedido (Checkout).
 * // Función para heredar el tema dinámico en el resumen de pedido.
 */
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
      {/* // Función para cerrar el modal al hacer clic en el fondo */}
      <div className="absolute inset-0 bg-background/95" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[2.5rem] p-8 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-500 border-t border-foreground/10 shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
        <div className="w-12 h-1.5 bg-foreground/10 rounded-full mx-auto mb-8" />
        
        {/* // Función para mostrar el título dinámico con la fuente del tema */}
        <PortalHeading as="h2" className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
          <ShoppingBag className="text-primary" aria-hidden="true" />
          Detalle de su Pedido
        </PortalHeading>

        {/* // Función para listar los productos seleccionados en el carrito */}
        <div className="space-y-4 mb-8">
          {cart.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center py-3 border-b border-foreground/5">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{item.quantity}x</div>
                <div>
                  <PortalText className="text-foreground font-medium">{item.name}</PortalText>
                  <PortalText muted className="text-xs">${item.price.toLocaleString()}</PortalText>
                </div>
              </div>
              <PortalText className="text-foreground font-bold">${(item.price * item.quantity).toLocaleString()}</PortalText>
            </div>
          ))}
        </div>

        {/* // Función para validar y mostrar la ubicación de la mesa confirmada */}
        {table.data ? (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 flex items-center justify-between animate-in fade-in zoom-in">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <PortalHeading as="h4" className="text-foreground font-bold text-lg leading-tight">Ubicación Confirmada</PortalHeading>
                <PortalText className="text-primary font-medium text-sm">Tu pedido llegará aquí.</PortalText>
              </div>
            </div>
            <div className="text-right">
              {/* // Función para mostrar la etiqueta de mesa con fuente de acento heredada */}
              <PortalText as="span" muted font="accent" className="block text-[10px] uppercase font-black tracking-widest mb-1">Mesa</PortalText>
              <PortalHeading as="h2" font="accent" className="text-3xl font-black italic text-primary tracking-tighter leading-none">#{table.data.number}</PortalHeading>
            </div>
          </div>
        ) : (
          /* // Función para alertar cuando no se detecta una mesa válida */
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-6 mb-8 flex items-center gap-4 animate-in fade-in zoom-in">
            <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
            <div>
              <PortalHeading as="h4" className="text-foreground font-bold text-sm leading-tight">Mesa no detectada</PortalHeading>
              <PortalText className="text-destructive font-medium text-xs mt-0.5">Escanea el código QR de tu mesa para continuar.</PortalText>
            </div>
          </div>
        )}

        {/* // Función para resumir los montos totales del pedido actual */}
        <div className="bg-foreground/[0.03] rounded-2xl p-6 mb-8 border border-foreground/5">
          <div className="flex justify-between items-center mb-2">
            <PortalText muted as="span" className="text-foreground/60">Subtotal</PortalText>
            <PortalText as="span" className="text-foreground font-medium">${cartTotal.toLocaleString()}</PortalText>
          </div>
          {table.data && (
            <div className="flex justify-between items-center mb-2">
              <PortalText muted as="span" className="text-foreground/60">Mesa</PortalText>
              <PortalText as="span" className="text-primary font-semibold">#{table.data.number}</PortalText>
            </div>
          )}
          <div className="flex justify-between items-center pt-4 border-t border-foreground/10">
            <PortalHeading as="h3" className="text-foreground font-bold text-lg">Total</PortalHeading>
            <PortalHeading as="h3" className="text-primary font-black text-2xl">${cartTotal.toLocaleString()}</PortalHeading>
          </div>
        </div>

        {/* // Función para visualizar errores durante el procesamiento del pedido */}
        {table.orderError && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-3 text-destructive text-sm animate-in fade-in zoom-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <PortalText className="font-bold">{table.orderError}</PortalText>
          </div>
        )}

        {/* // Función para ejecutar el envío final del pedido a la cocina */}
        <PortalPrimaryButton 
          disabled={placing || !table.data} 
          onClick={onPlaceOrder} 
          className="w-full py-4 text-lg"
        >
          {placing ? <><Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" /> Procesando…</> : <>Confirmar Pedido</>}
        </PortalPrimaryButton>

        {/* // Función para permitir al usuario seguir navegando el menú */}
        <PortalPrimaryButton 
          variant="ghost"
          onClick={onClose} 
          className="w-full mt-4 text-foreground/40 hover:text-foreground/60"
        >
          Continuar comprando
        </PortalPrimaryButton>
      </div>
    </div>
  );
}
