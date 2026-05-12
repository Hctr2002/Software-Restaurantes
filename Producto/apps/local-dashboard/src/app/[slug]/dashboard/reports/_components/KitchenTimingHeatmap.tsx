"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@menu-bites/ui";
import { Calendar } from "lucide-react";
import { TimingStats } from "@/hooks/useReportsData";

interface KitchenTimingHeatmapProps {
  stats: TimingStats[];
  loading: boolean;
  description: string;
}

export default function KitchenTimingHeatmap({ stats, loading, description }: KitchenTimingHeatmapProps) {
  const maxTotal = Math.max(...stats.map((s) => s.totalMin), 1);

  return (
    <Card className="glass rounded-[2.5rem] border-foreground/5 overflow-hidden xl:col-span-2">
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-black text-foreground uppercase italic tracking-tight">Tiempos de Cocina</CardTitle>
            <CardDescription className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">
              Promedios por categoría · {description}
            </CardDescription>
          </div>
        </div>
        {stats.length === 0 && !loading && (
          <p className="text-xs text-foreground/30 italic mt-2">
            Sin datos — requiere órdenes con timestamps completos (validated_at / ready_at).
          </p>
        )}
      </CardHeader>
      {stats.length > 0 && (
        <CardContent className="px-8 pb-8 space-y-5">
          {/* Legend */}
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500/60 inline-block" />Validación (min)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary/60 inline-block" />Cocina (min)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500/60 inline-block" />Total (min)</span>
          </div>

          {stats.map((stat) => (
            <div key={stat.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-foreground uppercase italic tracking-tight">{stat.category}</span>
                <span className="text-[10px] font-bold text-foreground/30">{stat.count} pedido{stat.count !== 1 ? "s" : ""}</span>
              </div>

              {/* Bars */}
              <div className="space-y-1">
                {/* Validación bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-foreground/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500/60 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min((stat.validationMin / maxTotal) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-blue-400 w-12 text-right tabular-nums">
                    {stat.validationMin === 0 ? "—" : `${stat.validationMin}m`}
                  </span>
                </div>
                {/* Cocina bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-foreground/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        stat.kitchenMin > 20 ? "bg-red-500/70" :
                        stat.kitchenMin > 10 ? "bg-yellow-500/70" : "bg-primary/60"
                      }`}
                      style={{ width: `${Math.min((stat.kitchenMin / maxTotal) * 100, 100)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-black w-12 text-right tabular-nums ${
                    stat.kitchenMin > 20 ? "text-red-400" :
                    stat.kitchenMin > 10 ? "text-yellow-400" : "text-primary"
                  }`}>
                    {stat.kitchenMin === 0 ? "—" : `${stat.kitchenMin}m`}
                  </span>
                </div>
                {/* Total bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-foreground/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500/50 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min((stat.totalMin / maxTotal) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 w-12 text-right tabular-nums">
                    {stat.totalMin === 0 ? "—" : `${stat.totalMin}m`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
