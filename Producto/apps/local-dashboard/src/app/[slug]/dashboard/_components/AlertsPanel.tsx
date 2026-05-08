"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bell, X, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlerts } from "@/hooks/useAlerts";
import AlertItem from "./AlertItem";

/**
 * AlertsPanel
 * 
 * Panel lateral de notificaciones que utiliza el hook useAlerts para 
 * la gestión de datos y suscripción en tiempo real.
 */
export default function AlertsPanel() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || "";
  const basePath = `/${slug}/dashboard`;

  const [open, setOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Hook centralizado para la lógica de alertas
  const { alerts, acting, resolveAlert, onNewAlert } = useAlerts();

  // Configurar el sonido cuando llegan alertas nuevas a través del hook
  useEffect(() => {
    onNewAlert(() => {
      audioRef.current?.play().catch((err) => {
        console.warn("Auto-play bloqueado por el navegador o error de audio:", err);
      });
    });
  }, [onNewAlert]);

  const pendingCount = alerts.length;

  return (
    <>
      {/* Audio para notificación: se mantiene local por requerimiento de interacción de usuario */}
      <audio 
        ref={audioRef} 
        src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" 
        preload="auto" 
      />

      {/* Botón de la Campana */}
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

      {/* Panel Deslizable (Dropdown Premium) */}
      <AnimatePresence>
        {open && (
          <>
            <div 
              className="fixed inset-0 z-[50] bg-black/20 backdrop-blur-sm" 
              onClick={() => setOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-8 top-24 w-96 bg-[#0a0a0b] border border-primary/20 z-[60] flex flex-col shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] rounded-[2.5rem] overflow-hidden"
            >
              {/* Header del Panel */}
              <div className="flex items-center justify-between px-8 py-7 border-b border-white/5 bg-primary/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground tracking-tighter uppercase italic">Alertas</h2>
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Centro de Notificaciones</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-3 rounded-2xl text-foreground/40 hover:text-foreground hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lista de Alertas */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar max-h-[70vh]">
                {alerts.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 text-foreground/20 gap-4">
                    <div className="w-16 h-16 rounded-[2rem] bg-white/5 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Todo bajo control</p>
                  </div>
                )}

                {alerts.map((alert) => (
                  <AlertItem 
                    key={alert.id}
                    alert={alert}
                    isActing={acting === alert.id}
                    onResolve={resolveAlert}
                    onNavigate={(path) => { 
                      setOpen(false); 
                      router.push(path); 
                    }}
                    basePath={basePath}
                  />
                ))}
              </div>

              {/* Footer opcional */}
              {pendingCount > 0 && (
                <div className="px-8 py-4 bg-white/5 border-t border-white/5 flex items-center justify-center">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">
                    Tienes {pendingCount} {pendingCount === 1 ? "atención pendiente" : "atenciones pendientes"}
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
