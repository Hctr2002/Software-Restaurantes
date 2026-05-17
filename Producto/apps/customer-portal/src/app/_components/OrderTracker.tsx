"use client";

/**
 * OrderTracker — Barra fija de estado del pedido activo.
 * Muestra los pasos PENDING → VALIDATED → PREPARING → READY con indicador de progreso.
 * Se posiciona bajo el header (top-[73px]) para no solapar la navegación.
 */

import React from "react";

const STATUS_STEPS = [
  { key: "PENDING",   label: "Solicitado",    icon: "📋" },
  { key: "VALIDATED", label: "Confirmado",     icon: "✅" },
  { key: "PREPARING", label: "En preparación", icon: "🔥" },
  { key: "READY",     label: "Listo",          icon: "🍽️" },
] as const;

/** Retorna el índice del estado actual en STATUS_STEPS, o -1 si no se reconoce. */
function getStepIndex(status: string): number {
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

interface Props {
  status: string;
}

export function OrderTracker({ status }: Props) {
  const currentIdx = getStepIndex(status);

  return (
    <div className="fixed top-[73px] left-0 right-0 z-40 px-4 py-2 bg-background border-b border-foreground/10 shadow-md">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 overflow-x-auto no-scrollbar">
          {STATUS_STEPS.map((step, idx) => {
            const done   = idx < currentIdx;
            const active = idx === currentIdx;
            return (
              <React.Fragment key={step.key}>
                <div className={`flex items-center gap-1.5 shrink-0 transition-all ${
                  active ? "opacity-100" : done ? "opacity-60" : "opacity-20"
                }`}>
                  <span className="text-base leading-none">{step.icon}</span>
                  <span className={`text-[10px] font-black uppercase tracking-wide ${active ? "text-primary" : "text-foreground/60"}`}>
                    {step.label}
                  </span>
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <span className={`text-[10px] shrink-0 transition-all ${idx < currentIdx ? "text-primary/60" : "text-foreground/10"}`}>
                    ›
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
        {status === "READY" && (
          <span className="text-[9px] font-black text-success bg-success/10 border border-success/20 px-2 py-1 rounded-lg shrink-0 animate-pulse">
            ¡Listo!
          </span>
        )}
      </div>
    </div>
  );
}
