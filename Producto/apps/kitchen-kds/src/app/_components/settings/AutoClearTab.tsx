"use client";

import { cn } from "@menu-bites/ui";
import type { KDSSettings } from "../../../lib/kdsSettings";

interface Props {
  draft: KDSSettings;
  onChange: (updated: KDSSettings) => void;
}

export function AutoClearTab({ draft, onChange }: Props) {
  const toggleEnabled = (v: boolean) => onChange({ ...draft, autoClear: { ...draft.autoClear, enabled: v } });
  const setDelay = (v: number) => onChange({ ...draft, autoClear: { ...draft.autoClear, delaySeconds: v } });

  return (
    <div className="space-y-4">
      <p className="text-foreground/40 text-sm">Las comandas marcadas como "Listo" desaparecen automáticamente.</p>
      <div className="flex items-center justify-between p-5 bg-foreground/5 rounded-2xl border border-foreground/5">
        <div>
          <p className="text-foreground font-semibold text-sm">Activar auto-borrado</p>
          <p className="text-foreground/40 text-xs mt-0.5">Elimina comandas listas tras el tiempo configurado</p>
        </div>
        <button onClick={() => toggleEnabled(!draft.autoClear.enabled)} className={cn("w-12 h-6 rounded-full transition-all relative flex-shrink-0", draft.autoClear.enabled ? "bg-primary" : "bg-foreground/10")}>
          <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-background transition-all", draft.autoClear.enabled ? "left-7" : "left-1")} />
        </button>
      </div>
      {draft.autoClear.enabled && (
        <div className="p-5 bg-foreground/5 rounded-2xl border border-foreground/5 space-y-3">
          <label className="text-foreground/60 text-xs uppercase tracking-widest font-bold">Tiempo de espera</label>
          <div className="flex items-center space-x-4">
            <input type="range" min={5} max={300} step={5} value={draft.autoClear.delaySeconds} onChange={(e) => setDelay(Number(e.target.value))} className="flex-1 accent-primary" />
            <span className="text-foreground font-black text-lg w-16 text-right">{draft.autoClear.delaySeconds}s</span>
          </div>
        </div>
      )}
    </div>
  );
}
