"use client";

/**
 * useCashierHooks — Hook de caja con pedidos activos e historial del día.
 * useCashierOrders: suscribe a pedidos activos (PENDING→DELIVERED) y el historial COMPLETED
 * del día. markDelivered cierra pedidos, libera la mesa y refuerza el estado.
 */

import { useCallback, useState } from "react";
import { supabase } from "../index";
import type { Order } from "../types";
import { mapOrder } from "../utils";
import { useRealtimeSync } from "./useRealtimeSync";

/**
 * Retorna pedidos activos e historial del día del restaurante.
 * markDelivered marca los pedidos como COMPLETED, libera la mesa y ejecuta refetch.
 * Omite pedidos ya en estado terminal (COMPLETED/REJECTED) para evitar conflictos.
 */
export function useCashierOrders(restaurantId: string | undefined) {
  const [history, setHistory] = useState<Order[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fetchFn = useCallback(async () => {
    if (!restaurantId) return { data: null, error: null };
    const { data, error } = await supabase
      .from("orders")
      .select(`*, table:tables(number), order_items(*, menu_items(name))`)
      .eq("restaurant_id", restaurantId)
      .in("status", ["PENDING", "VALIDATED", "PREPARING", "READY", "DELIVERED"])
      .order("createdAt", { ascending: true });
    
    const todayStr = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    
    const { data: historyData } = await supabase
      .from("orders")
      .select(`*, table:tables(number), order_items(*, menu_items(name))`)
      .eq("restaurant_id", restaurantId)
      .eq("status", "COMPLETED")
      .gte("createdAt", todayStr)
      .order("createdAt", { ascending: false })
      .limit(50);
    
    if (historyData) setHistory(historyData.map(mapOrder));
    
    return { data, error };
  }, [restaurantId]);

  const { data: orders, loading, refetch } = useRealtimeSync<Order[]>(
    restaurantId, 
    "orders", 
    fetchFn, 
    { 
      channelId: "cashier-orders",
      transform: (data: any) => Array.isArray(data) ? data.map(mapOrder) : []
    }
  );

  const markDelivered = async (orderIds: string[], tableId: string | null, reference: string) => {
    setIsProcessing(true);
    try {
      // Obtenemos los pedidos actuales para verificar sus estados antes de actualizar
      const { data: currentOrders } = await supabase
        .from("orders")
        .select("id, status")
        .in("id", orderIds);

      const validOrderIds = (currentOrders || [])
        .filter(o => o.status !== "COMPLETED" && o.status !== "REJECTED")
        .map(o => o.id);

      if (validOrderIds.length === 0) {
        // Si no hay pedidos válidos para actualizar, salimos exitosamente (ya están en estado terminal)
        return { success: true };
      }

      const { error: oErr } = await supabase
        .from("orders")
        .update({ 
          status: "COMPLETED", 
          notes: reference ? `Ref: ${reference}` : "Pagado en Caja",
        })
        .in("id", validOrderIds);
      if (oErr) throw oErr;

      if (tableId) {
        await supabase
          .from("tables")
          .update({ status: "FREE", bill_requested: false })
          .eq("id", tableId);
      }

      await refetch();
      return { success: true };
    } catch (err: any) {
      console.error("Error marking delivered:", err?.message ?? err?.code ?? JSON.stringify(err));
      return { success: false, error: err };
    } finally {
      setIsProcessing(false);
    }
  };

  return { orders, history, loading, refetch, markDelivered, isProcessing };
}
