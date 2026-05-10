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
    let query = supabase
      .from("orders")
      .select(`
        *,
        table:tables(id, number),
        users(email),
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
        let mapped = (data as any[]).map(mapOrder);
        
        if (station) {
          // Filtrar órdenes que tengan al menos un item para esta estación
          // Y filtrar los items de la orden para que solo muestre los de esa estación
          return mapped.filter(order => {
            const items = order.order_items || order.orderItems || [];
            const hasStationItems = items.some((item: any) => 
              item.menu_items?.category?.target_station === station
            );
            
            if (hasStationItems) {
              // Mutamos/filtramos los items para que el dashboard solo vea lo suyo
              if (order.order_items) {
                order.order_items = order.order_items.filter((item: any) => 
                  item.menu_items?.category?.target_station === station
                );
              }
              if (order.orderItems) {
                order.orderItems = order.orderItems.filter((item: any) => 
                  item.menuItem?.category?.targetStation === station
                );
              }
              return true;
            }
            return false;
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
