/**
 * useLocalDashboard — Agregador de datos en tiempo real para el dashboard principal del local.
 * Combina órdenes, estadísticas y mesas en un solo hook para la página de resumen.
 */
"use client";

import { useAuthStore } from "@menu-bites/store";
import { useRealtimeOrders, useRealtimeStats, useTables, STALE_ORDER_MINUTES } from "@menu-bites/auth";

/**
 * Orquesta los hooks de Realtime de @menu-bites/auth y expone un estado unificado
 * de carga, conteo de órdenes activas y umbral de orden vencida.
 */
export function useLocalDashboard() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId;

  // Hooks de tiempo real centralizados
  const { orders, loading: ordersLoading } = useRealtimeOrders(restaurantId);
  const { stats, loading: statsLoading } = useRealtimeStats(restaurantId);
  const { tables, loading: tablesLoading } = useTables(restaurantId);

  const loading = ordersLoading || statsLoading || tablesLoading;

  const activeOrdersCount = orders.filter(o => ["PENDING", "PREPARING"].includes(o.status)).length;

  return {
    user,
    restaurantId,
    orders,
    stats,
    tables,
    loading,
    activeOrdersCount,
    staleMinutes: STALE_ORDER_MINUTES
  };
}
