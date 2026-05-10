"use client";

import { useCallback } from "react";
import { supabase } from "../index";
import type { Order, StatsData, StationType } from "../types";
import { mapOrder } from "../utils";
import { useRealtimeSync } from "./useRealtimeSync";

export interface RealtimeOrdersOptions {
  statuses?: string[];
  limit?: number;
  includeItems?: boolean;
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

    // Si se especifica una estación, podríamos filtrar aquí o en el transform
    // Para simplificar y mantener el tiempo real estable, filtraremos en el transform
    // si es necesario, o podemos añadir un filtro post-fetch.
    return query;
  }, [restaurantId, statusesStr, limit, ascending]);

  const { data: orders, loading, refetch } = useRealtimeSync<Order[]>(
    restaurantId,
    "orders",
    fetchFn,
    { 
      channelId: `orders-${statusesStr}-${station || 'all'}`,
      transform: (data) => {
        if (!Array.isArray(data)) {
          console.warn(`[RealtimeOrders] Expected array but received:`, typeof data, data);
          return [];
        }

        let mapped = data.map(mapOrder);
        
        if (station) {
          const isKitchen = station === "KITCHEN";
          return mapped.filter(order => {
            const rawItems = order.order_items || [];
            const hasStationItems = rawItems.some((item: any) =>
              item.menu_items?.category?.target_station === station
            );
            if (!hasStationItems) return false;

            // Calcular status independiente para esta estación
            const stationReady     = isKitchen ? order.kitchenReady     : order.barReady;
            const stationPreparing = isKitchen ? order.kitchenPreparing : order.barPreparing;
            if (stationReady) {
              order.status = "READY";
            } else if (stationPreparing) {
              order.status = "PREPARING";
            } else {
              order.status = "VALIDATED";
            }

            // Filtrar items para que solo se vean los de esta estación
            order.order_items = rawItems.filter((item: any) =>
              item.menu_items?.category?.target_station === station
            );
            order.orderItems = (order.orderItems || []).filter((item: any) =>
              item.menuItem?.category?.targetStation === station
            );

            return true;
          });
        }
        
        return mapped;
      }
    }
  );

  return { orders, loading, refetch };
}

export function useKitchenOrders(restaurantId: string | undefined) {
  return useRealtimeOrders(restaurantId, {
    statuses: ["VALIDATED", "PREPARING", "READY"],
    ascending: true,
    station: 'KITCHEN'
  });
}

export function useBarOrders(restaurantId: string | undefined) {
  return useRealtimeOrders(restaurantId, {
    statuses: ["VALIDATED", "PREPARING", "READY"],
    ascending: true,
    station: 'BAR'
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
