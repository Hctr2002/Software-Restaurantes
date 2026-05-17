"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useKitchenOrders, updateOrderStatus, signOut } from "@menu-bites/auth";
import { useRouter } from "next/navigation";
import { loadSettings, saveSettings, DEFAULT_SETTINGS, type KDSSettings } from "../../lib/kdsSettings";
import { useMonitorNotifications } from "../../hooks/useMonitorNotifications";

export function useKitchenDashboard() {
  const { user, logout: clearAuth } = useAuthStore();
  const router = useRouter();
  
  const { orders: liveOrders, loading: liveLoading, refetch } = useKitchenOrders(user?.restaurantId);
  
  const [clearedOrders, setClearedOrders] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<KDSSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activeCol, setActiveCol] = useState<string>("preparing");
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);

  const autoClearTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => { setMounted(true); }, []);

  // Carga inicial de preferencias
  useEffect(() => { 
    if (mounted) {
      loadSettings().then(setSettings); 
    }
  }, [mounted]);

  // Tick para actualizar tiempos
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Filtrado de órdenes
  const orders = useMemo(() => 
    liveOrders.filter((o) => !clearedOrders.has(o.id)),
  [liveOrders, clearedOrders]);

  // Integración de notificaciones sonoras
  useMonitorNotifications({
    ordersCount: orders.length,
    orders,
    settings,
    tick
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await updateOrderStatus(orderId, newStatus);
      if (error) {
        console.error("[KDS] Error al actualizar estado:", error);
        return;
      }
      
      refetch();

      if (newStatus === "READY" && settings.autoClear.enabled) {
        const timer = setTimeout(
          () => setClearedOrders((prev) => new Set([...prev, orderId])),
          settings.autoClear.delaySeconds * 1000
        );
        autoClearTimers.current.set(orderId, timer);
      }
    } catch (err) {
      console.error("[KDS] Error inesperado en handleStatusChange:", err);
    }
  };

  const handleSaveSettings = async (s: KDSSettings) => {
    setSettings(s);
    await saveSettings(s);
    setSettingsOpen(false);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try { await signOut(); } finally {
      clearAuth();
      router.refresh();
      window.location.href = process.env.NEXT_PUBLIC_AUTH_URL || "/";
    }
  };

  const pendingOrders   = orders.filter((o) => o.status === "VALIDATED");
  const preparingOrders = orders.filter((o) => o.status === "PREPARING");
  const readyOrders     = orders.filter((o) => o.status === "READY");

  return {
    user,
    orders,
    loading: liveLoading || !mounted,
    mounted,
    settings,
    settingsOpen,
    setSettingsOpen,
    alertOpen,
    setAlertOpen,
    isSigningOut,
    activeCol,
    setActiveCol,
    pendingOrders,
    preparingOrders,
    readyOrders,
    handleStatusChange,
    handleSaveSettings,
    handleSignOut,
    setClearedOrders
  };
}
