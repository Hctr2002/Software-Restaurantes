"use client";

import { useAuthStore } from "@menu-bites/store";
import { useRealtimeOrders, useRealtimeStats, useTables } from "@menu-bites/auth";
import { useMemo } from "react";

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
