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
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />
          <aside className="fixed right-0 top-0 h-full w-full max-w-sm bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-bold text-slate-100">Alertas</h2>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
                    {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alert list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {alerts.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-slate-600 gap-2">
                  <CheckCircle className="w-8 h-8" />
                  <p className="text-sm">Sin alertas pendientes</p>
                </div>
              )}

              {alerts.map((alert) => {
                const cfg     = TYPE_CONFIG[alert.type];
                const loading = acting === alert.id;

                return (
                  <div
                    key={alert.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-800/40 space-y-3"
                  >
                    {/* Header de la alerta */}
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      <span className="text-[10px] text-slate-500 shrink-0">{timeAgo(alert.created_at)}</span>
                    </div>

                    {/* Remitente */}
                    <div className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">{senderLabel(alert)}</span>
                      {alert.table_number && (
                        <span className="ml-1">· Mesa {alert.table_number}</span>
                      )}
                      {alert.menu_item_name && (
                        <span className="ml-1 text-yellow-400">· {alert.menu_item_name}</span>
                      )}
                    </div>

                    {/* Mensaje */}
                    <p className="text-sm text-slate-200">{alert.message}</p>

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {alert.type === "STOCK_SHORTAGE" && alert.menu_item_id && (
                        <button
                          disabled={loading}
                          onClick={() => resolve(alert.id, "disable_item", alert.menu_item_id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/30 border border-red-800/40 text-red-400 text-xs font-semibold hover:bg-red-900/50 transition-colors disabled:opacity-50"
                        >
                          <PowerOff className="w-3.5 h-3.5" /> Deshabilitar plato
                        </button>
                      )}

                      {(alert.type === "STOCK_SHORTAGE") && (
                        <button
                          onClick={() => { setOpen(false); router.push(`${base}/inventory`); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                        >
                          <Package className="w-3.5 h-3.5" /> Ver inventario
                        </button>
                      )}

                      {(alert.type === "TABLE_ISSUE" || alert.type === "BILL_REQUEST") && (
                        <button
                          onClick={() => { setOpen(false); router.push(`${base}/orders`); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                        >
                          <ClipboardList className="w-3.5 h-3.5" /> Ver pedidos
                        </button>
                      )}

                      <button
                        disabled={loading}
                        onClick={() => resolve(alert.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-700 text-slate-400 text-xs font-semibold hover:bg-slate-700 hover:text-slate-200 transition-colors disabled:opacity-50 ml-auto"
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
