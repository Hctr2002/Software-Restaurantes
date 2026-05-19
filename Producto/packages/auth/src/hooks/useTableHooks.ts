"use client";

/**
 * useTableHooks — Hooks de mesas en tiempo real.
 * useTable: suscribe a una mesa específica por ID.
 * useTables: lista de todas las mesas del restaurante.
 * useTableOrders: pedidos activos de una mesa (filtra por session_id si está disponible).
 */

import { useCallback } from "react";
import { supabase } from "../index";
import type { TableRecord, Order } from "../types";
import { mapTable, mapOrder } from "../utils";
import { useRealtimeSync } from "./useRealtimeSync";

export function useTable(tableId: string | undefined) {
  const fetchFn = useCallback(async () => {
    if (!tableId) return { data: null, error: null };
    return supabase
      .from("tables")
      .select("*")
      .eq("id", tableId)
      .single();
  }, [tableId]);

  const { data: table, loading, refetch } = useRealtimeSync<TableRecord | null>(
    undefined,
    "tables",
    fetchFn,
    {
      channelId: `table-${tableId}`,
      filter: tableId ? `id=eq.${tableId}` : undefined,
      transform: (data: any) => data ? mapTable(data) : null,
    }
  );

  return { table, loading, refetch };
}

export function useTables(restaurantId: string | undefined) {
  const fetchFn = useCallback(async () => {
    if (!restaurantId) return { data: [], error: null };
    return supabase
      .from("tables")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("number", { ascending: true });
  }, [restaurantId]);

  const { data: tables, loading, refetch } = useRealtimeSync<TableRecord[]>(
    restaurantId, 
    "tables", 
    fetchFn,
    { transform: (data: any) => Array.isArray(data) ? data.map(mapTable) : [] }
  );

  return { tables, loading, refetch };
}

/**
 * Pedidos activos de una mesa (excluye REJECTED y COMPLETED).
 * Si sessionId está disponible filtra por sesión para soportar múltiples turnos en la misma mesa.
 */
export function useTableOrders(tableId: string | undefined, sessionId?: string | null) {
  const fetchFn = useCallback(async () => {
    if (!tableId) return { data: [], error: null };
    
    let query = supabase
      .from("orders")
      .select(`
        *,
        items:order_items(*, menu_item:menu_items(name))
      `);
      
    if (sessionId) {
      query = query.eq("session_id", sessionId);
    } else {
      query = query.eq("table_id", tableId);
    }
    
    return query
      .not("status", "in", '("REJECTED","COMPLETED")')
      .order("createdAt", { ascending: false });
  }, [tableId, sessionId]);

  const { data: orders, loading, refetch } = useRealtimeSync<Order[]>(
    undefined,
    "orders",
    fetchFn,
    { 
      channelId: `table-orders-${sessionId || tableId}`,
      filter: sessionId ? `session_id=eq.${sessionId}` : `table_id=eq.${tableId}`,
      transform: (data: any) => Array.isArray(data) ? data.map(mapOrder) : []
    }
  );

  return { orders, loading, refetch };
}
