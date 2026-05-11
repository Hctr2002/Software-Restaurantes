"use client";

import { cn } from "@menu-bites/ui";
import type { KDSSettings } from "../../../lib/kdsSettings";

interface ToggleRowProps {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between p-5 bg-foreground/5 rounded-2xl border border-foreground/5">
      <div>
        <p className="text-foreground font-semibold text-sm">{label}</p>
        <p className="text-foreground/40 text-xs mt-0.5">{description}</p>
      </div>
      <button onClick={() => onChange(!checked)} className={cn("w-12 h-6 rounded-full transition-all relative flex-shrink-0", checked ? "bg-primary" : "bg-foreground/10")}>
        <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-background transition-all", checked ? "left-7" : "left-1")} />
      </button>
    </div>
  );
}

interface Props {
  draft: KDSSettings;
  onChange: (updated: KDSSettings) => void;
}

export function SoundTab({ draft, onChange }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-foreground/40 text-sm">Notificaciones sonoras del sistema KDS.</p>
      <ToggleRow
        label="Nuevo ticket"
        description="Alerta cuando llega un nuevo pedido"
        checked={draft.sounds.newTicket}
        onChange={(v) => onChange({ ...draft, sounds: { ...draft.sounds, newTicket: v } })}
      />
      <ToggleRow
        label="Alerta crítica"
        description={`Alerta cuando un ticket supera ${draft.thresholds.red} minutos`}
        checked={draft.sounds.criticalAlert}
        onChange={(v) => onChange({ ...draft, sounds: { ...draft.sounds, criticalAlert: v } })}
      />
    </div>
  );
}
