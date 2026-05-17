"use client";

/**
 * OrderTracker (portal/ui) — Barra de progreso de estado del pedido para el portal.
 * Versión del package de OrderTracker: muestra los pasos PENDING→READY bajo el header.
 */

import React from "react";
import { PortalText } from "./primitives/PortalText";

/**
 * Pasos del ciclo de vida de un pedido.
 */
const STATUS_STEPS = [
  { key: "PENDING",   label: "Solicitado",    icon: "📋" },
  { key: "VALIDATED", label: "Confirmado",     icon: "✅" },
  { key: "PREPARING", label: "En preparación", icon: "🔥" },
  { key: "READY",     label: "Listo",          icon: "🍽️" },
] as const;

/**
 * Función para obtener el índice actual del paso basado en el estado del pedido.
 */
function getStepIndex(status: string): number {
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

interface OrderTrackerProps {
  status: string;
}

/**
 * Componente que muestra el progreso del pedido en tiempo real.
 * // Función para heredar el tema dinámico en los estados de seguimiento.
 */
export function OrderTracker({ status }: OrderTrackerProps) {
  const currentIdx = getStepIndex(status);

  return (
    <div className="fixed top-[73px] left-0 right-0 z-40 px-4 py-2 bg-background border-b border-foreground/5 shadow-md">
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
                  <span className="text-base leading-none" role="img" aria-label={step.label}>{step.icon}</span>
                  {/* Utilización de PortalText para garantizar herencia de fuente del tema */}
                  <PortalText 
                    as="span"
                    className={`text-[10px] font-black uppercase tracking-wide ${active ? "text-primary" : "text-foreground/40"}`}
                  >
                    {step.label}
                  </PortalText>
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
          <PortalText 
            as="span"
            className="text-[9px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg shrink-0 animate-pulse"
          >
            ¡Listo!
          </PortalText>
        )}
      </div>
    </div>
  );
}
