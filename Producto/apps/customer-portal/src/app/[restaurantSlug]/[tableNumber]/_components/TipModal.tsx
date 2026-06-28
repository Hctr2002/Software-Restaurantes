"use client";

/**
 * TipModal — Hoja deslizable de propina al pedir la cuenta.
 * El cliente decide si agregar propina (10%) antes de solicitar el cobro.
 * Hereda colores y tipografías del tema dinámico del restaurante via CSS vars.
 */

import { HandCoins, Loader2 } from "lucide-react";
import { formatCLP } from "@menu-bites/auth";
import { PortalHeading, PortalText, PortalPrimaryButton } from "@menu-bites/ui";

/** Porcentaje de propina sugerido. Debe coincidir con el cálculo de la caja (total * 0.1). */
const TIP_RATE = 0.1;

interface TipModalProps {
  /** Total acumulado de la mesa, para mostrar el monto de la propina. */
  tableTotal: number;
  /** Indica que la solicitud de cuenta está en curso. */
  submitting: boolean;
  /** Confirma la solicitud de cuenta con o sin propina. */
  onConfirm: (includeTip: boolean) => void;
  /** Cierra el modal sin pedir la cuenta. */
  onClose: () => void;
}

export function TipModal({ tableTotal, submitting, onConfirm, onClose }: TipModalProps) {
  const tipAmount = Math.round(tableTotal * TIP_RATE);

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
          La propina es voluntaria y apoya directamente al equipo del local.
        </PortalText>

        {/* Resumen de montos */}
        <div className="bg-foreground/[0.03] rounded-2xl p-6 mb-8 border border-foreground/5">
          <div className="flex justify-between items-center mb-2">
            <PortalText muted as="span" className="text-foreground/60">Subtotal consumo</PortalText>
            <PortalText as="span" className="text-foreground font-medium">{formatCLP(tableTotal)}</PortalText>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-foreground/10">
            <PortalText as="span" className="text-foreground/80 font-semibold">Propina sugerida (10%)</PortalText>
            <PortalText as="span" className="text-primary font-black">{formatCLP(tipAmount)}</PortalText>
          </div>
        </div>

        <PortalPrimaryButton
          disabled={submitting}
          onClick={() => onConfirm(true)}
          className="w-full py-4 text-lg"
        >
          {submitting ? <><Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" /> Procesando…</> : <>Agregar propina ({formatCLP(tipAmount)})</>}
        </PortalPrimaryButton>

        <PortalPrimaryButton
          variant="ghost"
          disabled={submitting}
          onClick={() => onConfirm(false)}
          className="w-full mt-4"
        >
          Sin propina
        </PortalPrimaryButton>
      </div>
    </div>
  );
}
