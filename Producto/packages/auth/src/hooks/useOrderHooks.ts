"use client";

import { useCallback } from "react";
import { supabase } from "../index";
import type { Order, StatsData, StationType } from "../types";
import { mapOrder } from "../utils";
import { useRealtimeSync } from "./useRealtimeSync";

export interface RealtimeOrdersOptions {
  statuses?: string[];
  limit?: number;
  ascending?: boolean;
  station?: StationType;
}

export function useRealtimeOrders(restaurantId: string | undefined, options: RealtimeOrdersOptions = {}) {
  const { statuses, limit = 50, ascending = false, station } = options;
  const statusesStr = JSON.stringify(statuses);

  const fetchFn = useCallback(async () => {
    if (!restaurantId) return { data: [], error: null };
    let query = supabase
      .from("orders")
      .select(`
        *,
        table:tables(id, number),
        order_items(*, menu_items(name, category:categories(target_station)))
      `)
      .eq("restaurant_id", restaurantId)
      .order("createdAt", { ascending })
      .limit(limit);

    if (statuses && statuses.length > 0) {
      query = query.in("status", statuses);
    }

    if (station) {
      // Include both orders with explicit station AND legacy orders (station IS NULL)
      query = query.or(`station.eq.${station},station.is.null`);
    }

    return query;
  }, [restaurantId, statusesStr, limit, ascending, station]);

  const { data: orders, loading, refetch } = useRealtimeSync<Order[]>(
    restaurantId,
    "orders",
    fetchFn,
    {
      channelId: `orders-${statusesStr}-${station || 'all'}`,
      transform: (data) => {
        if (!Array.isArray(data)) return [];
        return data.map(mapOrder).filter((order) => {
          if (!station) return true;
          // New orders: filter by explicit station field
          if (order.station) return order.station === station;
          // Legacy orders (station IS NULL): filter by item target_station
          const rawItems = order.order_items || [];
          return rawItems.some(
            (item: any) => item.menu_items?.category?.target_station === station
          );
        }).map((order) => {
          if (!station || order.station) return order;
          // Legacy null-station order: filter both raw and mapped items to this station only
          const rawItems = (order as any).order_items || [];
          const filteredRaw = rawItems.filter(
            (item: any) => item.menu_items?.category?.target_station === station
          );
          (order as any).order_items = filteredRaw;
          order.orderItems = (order.orderItems || []).filter((item: any) => {
            const s = item.menuItem?.category?.targetStation
              ?? (item as any).menu_items?.category?.target_station;
            return s === station;
          });
          return order;
        });
      },
    }
  );

  return { orders, loading, refetch };
}

export function useKitchenOrders(restaurantId: string | undefined) {
  return useRealtimeOrders(restaurantId, {
    statuses: ["VALIDATED", "PREPARING", "READY"],
    ascending: true,
    station: "KITCHEN",
  });
}

export function useBarOrders(restaurantId: string | undefined) {
  return useRealtimeOrders(restaurantId, {
    statuses: ["VALIDATED", "PREPARING", "READY"],
    ascending: true,
    station: "BAR",
  });
}

export function useRealtimeStats(restaurantId: string | undefined) {
  const fetchFn = useCallback(async () => {
    if (!restaurantId) return { data: null, error: null };
    try {
      const response = await fetch(`/api/local/stats`, { cache: 'no-store' });
      if (response.ok) {
        const json = await response.json();
        return { data: json.data, error: null };
      }
      // 401 is transient during token refresh — proxy handles renewal, no noise
      if (response.status === 401) return { data: null, error: null };
      return { data: null, error: `stats HTTP ${response.status}` };
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
