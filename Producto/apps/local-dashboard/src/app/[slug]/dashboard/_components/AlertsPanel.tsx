"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@menu-bites/auth";
import { useAuthStore } from "@menu-bites/store";
import { Badge } from "@menu-bites/ui";
import { Bell, X, CheckCircle, PowerOff, Package, ClipboardList, Loader2 } from "lucide-react";
import { Alert, AlertType, timeAgo } from "./localShared";

const TYPE_CONFIG: Record<AlertType, { label: string; variant: "danger" | "warning" | "info" | "neutral" }> = {
  TABLE_ISSUE:    { label: "Problema en Mesa",  variant: "danger"  },
  BILL_REQUEST:   { label: "Pedir Cuenta",       variant: "warning" },
  STOCK_SHORTAGE: { label: "Quiebre de Stock",   variant: "danger"  },
  HELP_REQUEST:   { label: "Ayuda Requerida",    variant: "info"    },
  GENERAL:        { label: "Mensaje",            variant: "neutral" },
};

function senderLabel(alert: Alert) {
  if (!alert.user_email) return "Sistema";
  return alert.user_email.split("@")[0];
}

export default function AlertsPanel() {
  const params    = useParams();
  const router    = useRouter();
  const slug      = (params?.slug as string) || "";
  const base      = `/${slug}/dashboard`;
  const { user }  = useAuthStore();

  const [open,    setOpen]    = useState(false);
  const [alerts,  setAlerts]  = useState<Alert[]>([]);
  const [acting,  setActing]  = useState<string | null>(null);
  const audioRef              = useRef<HTMLAudioElement | null>(null);
  const prevCount             = useRef(0);

  const fetchAlerts = useCallback(async () => {
    const res  = await fetch("/api/local/alerts?status=PENDING", { cache: "no-store" });
    const json = await res.json();
    const next: Alert[] = json.data || [];

    if (next.length > prevCount.current && prevCount.current >= 0) {
      audioRef.current?.play().catch(() => {});
    }
    prevCount.current = next.length;
    setAlerts(next);
  }, []);

  useEffect(() => {
    fetchAlerts();

    const channel = supabase
      .channel("alerts-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAlerts]);

  const resolve = async (id: string, action?: "disable_item", menuItemId?: string | null) => {
    setActing(id);
    try {
      await fetch(`/api/local/alerts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: action ?? "resolve", menuItemId: menuItemId ?? undefined }),
      });
      fetchAlerts();
    } finally {
      setActing(null);
    }
  };

  const pendingCount = alerts.length;

  return (
    <>
      {/* Audio para notificación */}
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="none" />

      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        aria-label="Alertas"
      >
        <Bell className="w-5 h-5" />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>

      {/* Slide-over panel */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]" onClick={() => setOpen(false)} />
          <aside className="fixed right-0 top-0 h-full w-full max-w-sm bg-background/95 backdrop-blur-2xl border-l border-white/10 z-[70] flex flex-col shadow-2xl transform transition-transform duration-500 animate-in slide-in-from-right">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-black text-foreground tracking-tighter uppercase italic">Alertas</h2>
                {pendingCount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-2xl text-foreground/40 hover:text-foreground hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {alerts.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-foreground/20 gap-4">
                  <div className="w-16 h-16 rounded-[2rem] bg-white/5 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Todo bajo control</p>
                </div>
              )}

              {alerts.map((alert) => {
                const cfg     = TYPE_CONFIG[alert.type];
                const loading = acting === alert.id;

                return (
                  <div
                    key={alert.id}
                    className="p-6 rounded-[2.5rem] border border-white/5 bg-white/5 space-y-4 group hover:border-primary/20 transition-all"
                  >
                    {/* Header de la alerta */}
                    <div className="flex items-start justify-between gap-4">
                      <Badge variant={cfg.variant} className="px-3 py-1 text-[9px] font-black uppercase tracking-widest">{cfg.label}</Badge>
                      <span className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest shrink-0">{timeAgo(alert.created_at)}</span>
                    </div>

                    {/* Mensaje */}
                    <div>
                      <p className="text-sm font-bold text-foreground uppercase italic tracking-tight">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] font-black text-foreground/30 uppercase tracking-widest">
                        <span className="text-primary">{senderLabel(alert)}</span>
                        {alert.table_number && (
                          <>
                            <span className="opacity-20">•</span>
                            <span>Mesa {alert.table_number}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {alert.type === "STOCK_SHORTAGE" && alert.menu_item_id && (
                        <button
                          disabled={loading}
                          onClick={() => resolve(alert.id, "disable_item", alert.menu_item_id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                        >
                          <PowerOff className="w-3.5 h-3.5" /> Deshabilitar
                        </button>
                      )}

                      {(alert.type === "STOCK_SHORTAGE") && (
                        <button
                          onClick={() => { setOpen(false); router.push(`${base}/inventory`); }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-foreground/60 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-foreground transition-all"
                        >
                          <Package className="w-3.5 h-3.5" /> Inventario
                        </button>
                      )}

                      {(alert.type === "TABLE_ISSUE" || alert.type === "BILL_REQUEST") && (
                        <button
                          onClick={() => { setOpen(false); router.push(`${base}/orders`); }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-foreground/60 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-foreground transition-all"
                        >
                          <ClipboardList className="w-3.5 h-3.5" /> Pedidos
                        </button>
                      )}

                      <button
                        disabled={loading}
                        onClick={() => resolve(alert.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:bg-primary/80 transition-all disabled:opacity-50 ml-auto shadow-lg shadow-primary/20"
                      >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Resolver
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
