"use client";

/**
 * RatingModal (portal/ui) — Modal de valoración del servicio del package @menu-bites/ui.
 * Se muestra tras la entrega del pedido. Soporta 1-5 estrellas y comentario opcional.
 */

import React from "react";
import { Loader2 } from "lucide-react";
import { PortalHeading } from "./primitives/PortalHeading";
import { PortalText } from "./primitives/PortalText";
import { PortalPrimaryButton } from "./primitives/PortalPrimaryButton";
import { PortalCard } from "./primitives/PortalCard";

interface RatingModalProps {
  restaurantName: string;
  stars: number;
  comment: string;
  submitting: boolean;
  done: boolean;
  onStarsChange: (s: number) => void;
  onCommentChange: (c: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
}

/**
 * Modal de calificación para el feedback del cliente.
 * // Función para heredar el tema dinámico en el formulario de feedback.
 */
export function RatingModal({
  restaurantName, stars, comment, submitting, done,
  onStarsChange, onCommentChange, onSubmit, onSkip,
}: RatingModalProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-background/95" />
      
      {/* Utilización de PortalCard para el contenedor principal */}
      <PortalCard className="relative w-full max-w-md bg-card border border-foreground/10 rounded-t-[2.5rem] p-8 pb-10 space-y-6 animate-in slide-in-from-bottom duration-400 shadow-2xl">
        {done ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-3xl">🎉</p>
            <PortalHeading as="h3" className="text-lg font-bold text-foreground">
              ¡Gracias por tu opinión!
            </PortalHeading>
            <PortalText muted className="text-sm">
              Tu feedback ayuda a mejorar el servicio.
            </PortalText>
          </div>
        ) : (
          <>
            <div className="text-center">
              <PortalHeading as="h3" className="text-xl font-bold text-foreground">
                ¿Cómo fue tu experiencia?
              </PortalHeading>
              <PortalText muted className="text-sm mt-1">
                Califica tu pedido en {restaurantName}
              </PortalText>
            </div>

            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => onStarsChange(s)}
                  className={`text-4xl transition-transform active:scale-90 ${s <= stars ? "opacity-100 text-primary" : "opacity-20 text-foreground"}`}
                >
                  ★
                </button>
              ))}
            </div>

            {stars > 0 && (
              <textarea
                rows={2}
                placeholder="Cuéntanos más (opcional)…"
                value={comment}
                onChange={(e) => onCommentChange(e.target.value)}
                // Inyectamos la fuente del cuerpo manualmente para el textarea
                style={{ fontFamily: "var(--font-body)" }}
                className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-2xl px-4 py-3 text-foreground text-sm resize-none focus:outline-none focus:border-primary/50"
              />
            )}

            <div className="flex gap-3">
              {/* // Función para omitir el feedback y cerrar el modal */}
              <PortalPrimaryButton
                variant="ghost"
                onClick={onSkip}
                className="flex-1"
              >
                Omitir
              </PortalPrimaryButton>
              
              {/* Botón primario utilizando el primitivo semántico */}
              <PortalPrimaryButton
                onClick={onSubmit}
                disabled={!stars || submitting}
                className="flex-1"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Enviar"}
              </PortalPrimaryButton>
            </div>
          </>
        )}
      </PortalCard>
    </div>
  );
}
