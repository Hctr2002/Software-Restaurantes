"use client";

/**
 * TipModal — Hoja deslizable de propina al pedir la cuenta.
 * El cliente decide si agregar propina y puede modificar el monto;
 * por defecto sugiere el 10% y muestra en vivo a qué porcentaje equivale el monto.
 * Hereda colores y tipografías del tema dinámico del restaurante via CSS vars.
 */

import { useState } from "react";
import { HandCoins, Loader2 } from "lucide-react";
import { formatCLP } from "@menu-bites/auth";
import { PortalHeading, PortalText, PortalPrimaryButton } from "@menu-bites/ui";

/** Porcentaje de propina sugerido por defecto. */
const DEFAULT_TIP_RATE = 0.1;
/** Presets rápidos de porcentaje. */
const PRESETS = [10, 15, 20];

interface TipModalProps {
  /** Total acumulado de la mesa, base para calcular la propina. */
  tableTotal: number;
  /** Indica que la solicitud de cuenta está en curso. */
  submitting: boolean;
  /** Confirma la solicitud de cuenta con el monto de propina elegido (0 = sin propina). */
  onConfirm: (tipAmount: number) => void;
  /** Cierra el modal sin pedir la cuenta. */
  onClose: () => void;
}

export function TipModal({ tableTotal, submitting, onConfirm, onClose }: TipModalProps) {
  const [amount, setAmount] = useState<number>(Math.round(tableTotal * DEFAULT_TIP_RATE));

  const pct = tableTotal > 0 ? Math.round((amount / tableTotal) * 100) : 0;
  const isPresetActive = (p: number) => amount === Math.round(tableTotal * (p / 100));

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
          Es voluntaria y la recibe directamente el equipo del local. Puedes ajustar el monto.
        </PortalText>

        {/* Subtotal */}
        <div className="flex justify-between items-center mb-4 px-1">
          <PortalText muted as="span" className="text-foreground/60">Subtotal consumo</PortalText>
          <PortalText as="span" className="text-foreground font-medium">{formatCLP(tableTotal)}</PortalText>
        </div>

        {/* Presets de porcentaje */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={submitting}
              onClick={() => setAmount(Math.round(tableTotal * (p / 100)))}
              className={`py-3 rounded-2xl border text-sm font-black uppercase tracking-wider transition-all ${
                isPresetActive(p)
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-muted/30 text-foreground/70 border-border hover:bg-primary/10"
              }`}
            >
              {p}%
            </button>
          ))}
        </div>

        {/* Monto editable */}
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
            <span className="text-primary font-black text-lg whitespace-nowrap">{pct}%</span>
          </div>
        </label>

        <PortalPrimaryButton
          disabled={submitting || amount <= 0}
          onClick={() => onConfirm(amount)}
          className="w-full py-4 text-lg"
        >
          {submitting ? <><Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" /> Procesando…</> : <>Agregar propina ({formatCLP(amount)})</>}
        </PortalPrimaryButton>

        <PortalPrimaryButton
          variant="ghost"
          disabled={submitting}
          onClick={() => onConfirm(0)}
          className="w-full mt-4"
        >
          Sin propina
        </PortalPrimaryButton>
      </div>
    </div>
  );
}
