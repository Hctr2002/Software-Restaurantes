"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@menu-bites/auth";
import { Alert } from "../app/[slug]/dashboard/_components/localShared";

/**
 * Hook useAlerts
 * 
 * Gestiona el estado de las alertas pendientes con suscripción Realtime.
 */
export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  
  // Referencia para detectar nuevas alertas y disparar eventos (como sonido)
  const prevCount = useRef(-1);
  const onNewAlertCallback = useRef<(() => void) | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/local/alerts?status=PENDING", { cache: "no-store" });
      const json = await res.json();
      const next: Alert[] = json.data || [];

      // Solo disparamos el sonido si no es la carga inicial y el número de alertas aumentó
      if (prevCount.current !== -1 && next.length > prevCount.current) {
        onNewAlertCallback.current?.();
      }
      
      prevCount.current = next.length;
      setAlerts(next);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    // Suscripción Realtime para cambios en la tabla alerts
    const channel = supabase
      .channel("alerts-realtime-hook")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  /**
   * Resolver una alerta (marcar como RESOLVED en DB)
   */
  const resolveAlert = async (id: string, action?: "disable_item", menuItemId?: string | null) => {
    setActing(id);
    try {
      await fetch(`/api/local/alerts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: action ?? "resolve", 
          menuItemId: menuItemId ?? undefined 
        }),
      });
      await fetchAlerts();
    } catch (error) {
      console.error("Error resolving alert:", error);
    } finally {
      setActing(null);
    }
  };

  return {
    alerts,
    loading,
    acting,
    resolveAlert,
    refresh: fetchAlerts,
    // Permite registrar un callback para cuando lleguen alertas nuevas
    onNewAlert: (cb: () => void) => {
      onNewAlertCallback.current = cb;
    }
  };
}
