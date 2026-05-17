/**
 * useLocalDashboard (app/_hooks) — Versión optimizada del hook de dashboard con useMemo.
 * Alternativa al hook homónimo de src/hooks/; es la versión usada por el dashboard principal.
 * Combina órdenes, estadísticas y mesas en tiempo real desde @menu-bites/auth.
 */
"use client";

import { useAuthStore } from "@menu-bites/store";
import { useRealtimeOrders, useRealtimeStats, useTables } from "@menu-bites/auth";
import { useMemo } from "react";

/**
 * Agrega los tres hooks de Realtime y calcula activeOrdersCount con useMemo para evitar re-renders.
 */
export function useLocalDashboard() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId;

  const { orders, loading: ordersLoading } = useRealtimeOrders(restaurantId);
  const { stats, loading: statsLoading } = useRealtimeStats(restaurantId);
  const { tables, loading: tablesLoading } = useTables(restaurantId);

  const activeOrdersCount = useMemo(() => 
    orders.filter(o => ["PENDING", "PREPARING"].includes(o.status)).length,
  [orders]);

  const loading = ordersLoading || statsLoading || tablesLoading;

  return {
    user,
    restaurantId,
    orders,
    stats,
    tables,
    activeOrdersCount,
    loading
  };
}
