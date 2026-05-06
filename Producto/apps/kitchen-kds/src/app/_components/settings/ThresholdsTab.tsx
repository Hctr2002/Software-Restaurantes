"use client";

import { cn } from "@menu-bites/ui";
import type { KDSSettings } from "../../../lib/kdsSettings";

interface Props {
  draft: KDSSettings;
  onChange: (updated: KDSSettings) => void;
}

function ThresholdRow({ label, description, color, value, onChange }: {
  label: string; description: string; color: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
      <div>
        <p className={cn("font-bold text-sm", color)}>{label}</p>
        <p className="text-white/40 text-xs">{description}</p>
      </div>
      <div className="flex items-center space-x-4">
        <input type="range" min={1} max={60} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-primary" />
        <span className="text-white font-black text-lg w-16 text-right">{value} min</span>
      </div>
    </div>
  );
}

function Preview({ label, color }: { label: string; color: string }) {
  return <div className={cn("flex-1 p-3 rounded-xl border text-center text-xs font-bold", color)}>{label}</div>;
}

export function ThresholdsTab({ draft, onChange }: Props) {
  const setYellow = (v: number) => onChange({ ...draft, thresholds: { ...draft.thresholds, yellow: v } });
  const setRed    = (v: number) => onChange({ ...draft, thresholds: { ...draft.thresholds, red: v } });

  return (
    <div className="space-y-5">
      <p className="text-white/40 text-sm">Minutos a partir de los cuales una comanda cambia de color.</p>
      <ThresholdRow label="Amarillo" description="Alerta moderada" color="text-yellow-400" value={draft.thresholds.yellow} onChange={setYellow} />
      <ThresholdRow label="Rojo" description="Estado crítico" color="text-red-400" value={draft.thresholds.red} onChange={setRed} />
      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
        <p className="text-[11px] text-white/40 uppercase tracking-widest font-bold mb-3">Vista previa</p>
        <div className="flex space-x-3">
          <Preview label={`Verde < ${draft.thresholds.yellow}m`} color="border-emerald-500/50 text-emerald-400" />
          <Preview label={`Amarillo ${draft.thresholds.yellow}–${draft.thresholds.red}m`} color="border-yellow-500/50 text-yellow-400" />
          <Preview label={`Rojo > ${draft.thresholds.red}m`} color="border-red-500/50 text-red-400" />
        </div>
      </div>
    </div>
  );
}
