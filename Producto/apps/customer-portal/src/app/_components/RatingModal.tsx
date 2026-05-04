"use client";

import { Loader2 } from "lucide-react";

interface Props {
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

export function RatingModal({
  restaurantName, stars, comment, submitting, done,
  onStarsChange, onCommentChange, onSubmit, onSkip,
}: Props) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-navy-dark/80 backdrop-blur-md" />
      <div className="relative w-full max-w-md glass-panel rounded-t-[2.5rem] p-8 pb-10 space-y-6 animate-in slide-in-from-bottom duration-400">
        {done ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-3xl">🎉</p>
            <p className="text-lg font-bold text-sand">¡Gracias por tu opinión!</p>
            <p className="text-sm text-sand/60">Tu feedback ayuda a mejorar el servicio.</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-xl font-bold text-sand">¿Cómo fue tu experiencia?</p>
              <p className="text-sm text-sand/50 mt-1">Califica tu pedido en {restaurantName}</p>
            </div>

            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => onStarsChange(s)}
                  className={`text-4xl transition-transform active:scale-90 ${s <= stars ? "opacity-100" : "opacity-20"}`}
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
                className="w-full bg-navy-light/40 border border-white/10 rounded-2xl px-4 py-3 text-sand text-sm resize-none focus:outline-none focus:border-sage/50"
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={onSkip}
                className="flex-1 py-3 rounded-2xl border border-white/10 text-sand/50 text-sm font-medium hover:bg-sand/5 transition-colors"
              >
                Omitir
              </button>
              <button
                onClick={onSubmit}
                disabled={!stars || submitting}
                className="flex-1 py-3 rounded-2xl bg-sage hover:bg-sage/90 text-navy-dark font-bold text-sm transition-all disabled:opacity-40"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Enviar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
