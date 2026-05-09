"use client";

import { useCallback } from "react";
import { supabase } from "../index";
import type { Order, StatsData } from "../types";
import { mapOrder } from "../utils";
import { useRealtimeSync } from "./useRealtimeSync";

export interface RealtimeOrdersOptions {
  statuses?: string[];
  limit?: number;
  includeItems?: boolean;
  ascending?: boolean;
}

export function useRealtimeOrders(restaurantId: string | undefined, options: RealtimeOrdersOptions = {}) {
  const { statuses, limit = 50, ascending = false } = options;
  const statusesStr = JSON.stringify(statuses);

  const fetchFn = useCallback(async () => {
    let query = supabase
      .from("orders")
      .select(`
        *,
        table:tables(id, number),
        users(email),
        order_items(*, menu_items(name))
      `)
      .eq("restaurant_id", restaurantId)
      .order("createdAt", { ascending })
      .limit(limit);

    if (statuses && statuses.length > 0) {
      query = query.in("status", statuses);
    }

    return query;
  }, [restaurantId, statusesStr, limit, ascending]);

  const { data: orders, loading, refetch } = useRealtimeSync<Order[]>(
    restaurantId,
    "orders",
    fetchFn,
    { 
      channelId: `orders-${statusesStr}`,
      transform: mapOrder
    }
  );

  return { orders, loading, refetch };
}

export function useKitchenOrders(restaurantId: string | undefined) {
  return useRealtimeOrders(restaurantId, {
    statuses: ["PENDING", "VALIDATED", "PREPARING", "READY"],
    ascending: true
  });
}

export function useRealtimeStats(restaurantId: string | undefined) {
  const fetchFn = useCallback(async () => {
    if (!restaurantId) return { data: null, error: "No restaurant ID" };
    try {
      const response = await fetch(`/api/local/stats`, { cache: 'no-store' });
      if (response.ok) {
        const json = await response.json();
        return { data: json.data, error: null };
      }
      return { data: null, error: "Failed to fetch stats" };
    } catch (err) {
      return { data: null, error: err };
    }
  }, [restaurantId]);

  const { data: stats, loading, refetch } = useRealtimeSync<StatsData | null>(
    restaurantId,
    "orders",
    fetchFn,
    { channelId: "local-stats" }
  );

  return { stats, loading, refetch };
}
