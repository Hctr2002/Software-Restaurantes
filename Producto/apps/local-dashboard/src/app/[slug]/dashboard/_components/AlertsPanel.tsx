"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bell, X, CheckCircle, Volume2, VolumeX, AlertCircle } from "lucide-react";
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
  const [isMuted, setIsMuted] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Hook centralizado para la lógica de alertas
  const { alerts, acting, resolveAlert, onNewAlert } = useAlerts();

  // Función para intentar reproducir sonido y detectar si está bloqueado
  const playNotificationSound = async () => {
    if (isMuted || !audioRef.current) return;
    
    try {
      await audioRef.current.play();
      setAudioBlocked(false);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setAudioBlocked(true);
        console.warn("Auto-play bloqueado por el navegador. Se requiere interacción del usuario.");
      }
    }
  };

  // Activar audio mediante interacción de usuario
  const enableAudio = async () => {
    if (!audioRef.current) return;
    const prevVolume = audioRef.current.volume;
    try {
      // Reproducimos un fragmento casi imperceptible para "desbloquear" el contexto de audio
      audioRef.current.volume = 0;
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 1;

      setAudioBlocked(false);
      setIsMuted(false);
    } catch (err) {
      console.error("Error al habilitar audio:", err);
      audioRef.current.volume = prevVolume;
    }
  };

  // Configurar el sonido cuando llegan alertas nuevas a través del hook
  useEffect(() => {
    onNewAlert(() => {
      playNotificationSound();
    });
  }, [onNewAlert, isMuted]);

  const pendingCount = alerts.length;

  return (
    <>
      {/* Audio para notificación */}
      <audio 
        ref={audioRef} 
        src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" 
        preload="auto" 
      />

      {/* Botón de la Campana */}
      <div className="flex items-center gap-2">
        {audioBlocked && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={enableAudio}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-tighter hover:bg-amber-500/20 transition-all animate-pulse"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Activar Sonido</span>
          </motion.button>
        )}
        
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative p-2 rounded-xl text-foreground/60 hover:text-primary hover:bg-primary/10 transition-all duration-300"
          aria-label="Alertas"
        >
          <Bell className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-primary-foreground text-[10px] font-black flex items-center justify-center animate-pulse shadow-lg shadow-red-500/20">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Panel Deslizable (Dropdown Premium) */}
      <AnimatePresence>
        {open && (
          <>
            <div 
              className="fixed inset-0 z-[50] bg-black/10 backdrop-blur-[2px]" 
              onClick={() => setOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-8 top-24 w-96 bg-card/95 glass-premium border border-foreground/10 z-[60] flex flex-col shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] rounded-[2.5rem] overflow-hidden"
            >
              {/* Header del Panel */}
              <div className="flex items-center justify-between px-8 py-7 border-b border-foreground/5 bg-primary/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground tracking-tighter uppercase italic">Alertas</h2>
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Centro de Notificaciones</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3 rounded-2xl transition-all ${isMuted ? 'text-red-500 bg-red-500/10' : 'text-foreground/40 hover:text-foreground hover:bg-foreground/5'}`}
                    title={isMuted ? "Quitar silencio" : "Silenciar alertas"}
                    aria-label={isMuted ? "Quitar silencio" : "Silenciar alertas"}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-3 rounded-2xl text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all"
                    aria-label="Cerrar panel de alertas"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Lista de Alertas */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar max-h-[70vh]">
                {audioBlocked && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-tight">Audio Bloqueado</p>
                        <p className="text-[9px] text-amber-500/70 font-medium leading-tight">Haz clic para activar las notificaciones sonoras.</p>
                      </div>
                      <button 
                        onClick={enableAudio}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 text-black text-[9px] font-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
                      >
                        Activar
                      </button>
                    </div>
                  </div>
                )}

                {alerts.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 text-foreground/20 gap-4">
                    <div className="w-16 h-16 rounded-[2rem] bg-foreground/5 flex items-center justify-center">
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
                <div className="px-8 py-4 bg-foreground/5 border-t border-foreground/5 flex items-center justify-center">
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
