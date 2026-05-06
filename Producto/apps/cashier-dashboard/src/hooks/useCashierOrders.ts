"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@menu-bites/auth";
import type { Order } from "../app/_components/OrderGroupCard";

export function useCashierOrders(restaurantId: string | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [history, setHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const SELECT = "id, status, createdAt, total_amount, table_id, session_id, tables(id, number), users(email), order_items(id, quantity, unit_price, menu_items(name))";

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) { setLoading(false); return; }
    setLoading(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingRes, historyRes] = await Promise.all([
      supabase
        .from("orders")
        .select(SELECT)
        .eq("restaurant_id", restaurantId)
        .eq("status", "READY")
        .order("createdAt", { ascending: true }),
      supabase
        .from("orders")
        .select(SELECT)
        .eq("restaurant_id", restaurantId)
        .eq("status", "DELIVERED")
        .gte("createdAt", today.toISOString())
        .order("createdAt", { ascending: false })
        .limit(20),
    ]);

    setOrders((pendingRes.data as unknown as Order[]) ?? []);
    setHistory((historyRes.data as unknown as Order[]) ?? []);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    fetchOrders();
    const channel = supabase
      .channel("cashier-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders, restaurantId]);

  return { orders, history, loading, fetchOrders };
}
