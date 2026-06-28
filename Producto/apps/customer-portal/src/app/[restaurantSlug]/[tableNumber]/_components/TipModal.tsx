"use client";

/**
 * TipModal — Hoja deslizable de propina al pedir la cuenta.
 * Sugiere por defecto el 10% del consumo, pero el cliente edita libremente el
 * MONTO en pesos (puede dejar más, o 0 para no dejar propina). La propina es
 * voluntaria; no se muestra el porcentaje.
 * Hereda colores y tipografías del tema dinámico del restaurante via CSS vars.
 */

import { useState } from "react";
import { HandCoins, Loader2 } from "lucide-react";
import { formatCLP } from "@menu-bites/auth";
import { PortalHeading, PortalText, PortalPrimaryButton } from "@menu-bites/ui";

/** Porcentaje de propina sugerido por defecto (solo para calcular el monto inicial). */
const DEFAULT_TIP_RATE = 0.1;

interface TipModalProps {
  /** Total acumulado de la mesa, base para la sugerencia del 10%. */
  tableTotal: number;
  /** Indica que la solicitud de cuenta está en curso. */
  submitting: boolean;
  /** Confirma la solicitud de cuenta con el monto de propina elegido (0 = sin propina). */
  onConfirm: (tipAmount: number) => void;
  /** Cierra el modal sin pedir la cuenta. */
  onClose: () => void;
}

export function TipModal({ tableTotal, submitting, onConfirm, onClose }: TipModalProps) {
  // Sugerencia inicial: 10% del consumo. El cliente puede editar el monto libremente.
  const [amount, setAmount] = useState<number>(Math.round(tableTotal * DEFAULT_TIP_RATE));

  return (
    <div className="fixed inset-0 z-[60] animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-background/95" onClick={submitting ? undefined : onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[2.5rem] p-8 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-500 border-t border-foreground/10 shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
        <div className="w-12 h-1.5 bg-foreground/10 rounded-full mx-auto mb-8" />

        <PortalHeading as="h2" className="text-2xl font-bold text-foreground mb-2 flex items-center gap-3">
          <HandCoins className="text-primary" aria-hidden="true" />
          ¿Deseas dejar propina?
        </PortalHeading>
        <PortalText muted className="text-sm mb-6">
          Te sugerimos el 10% de tu consumo. Es voluntaria: puedes editar el monto o dejarlo en 0.
        </PortalText>

        {/* Subtotal */}
        <div className="flex justify-between items-center mb-4 px-1">
          <PortalText muted as="span" className="text-foreground/60">Subtotal consumo</PortalText>
          <PortalText as="span" className="text-foreground font-medium">{formatCLP(tableTotal)}</PortalText>
        </div>

        {/* Monto de propina editable (en pesos) */}
        <label className="block mb-6">
          <PortalText muted as="span" className="text-[10px] uppercase font-black tracking-widest mb-2 block">
            Monto de propina
          </PortalText>
          <div className="flex items-center gap-3 bg-foreground/[0.03] rounded-2xl px-5 py-4 border border-foreground/10 focus-within:border-primary/50 transition-colors">
            <span className="text-foreground/50 font-black text-lg">$</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={amount}
              disabled={submitting}
              onChange={(e) => setAmount(Math.max(0, Math.round(Number(e.target.value) || 0)))}
              className="flex-1 bg-transparent outline-none text-foreground font-black text-2xl tracking-tight w-full"
            />
          </div>
        </label>

        <PortalPrimaryButton
          disabled={submitting}
          onClick={() => onConfirm(amount)}
          className="w-full py-4 text-lg"
        >
          {submitting
            ? <><Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" /> Procesando…</>
            : amount > 0
              ? <>Agregar propina ({formatCLP(amount)})</>
              : <>Pedir cuenta sin propina</>}
        </PortalPrimaryButton>
      </div>
    </div>
  );
}
