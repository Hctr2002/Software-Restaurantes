"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, updateOrderStatus } from "@menu-bites/auth";
import type { PendingOrder } from "../app/_components/PendingOrderCard";

const READY_SFX = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export function useWaiterOrders(restaurantId: string | undefined) {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [readyOrders, setReadyOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notesByOrder, setNotesByOrder] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const prevReadyCount = useRef(0);

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, status, table_id, total_amount, createdAt, tables(number), order_items(id, quantity, menu_items(name))")
      .eq("restaurant_id", restaurantId)
      .in("status", ["PENDING", "READY"])
      .order("createdAt", { ascending: true });

    const rows = (data as unknown as PendingOrder[]) ?? [];
    setPendingOrders(rows.filter((o) => o.status === "PENDING"));
    setReadyOrders(rows.filter((o) => o.status === "READY"));
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    fetchOrders();
    const channel = supabase
      .channel(`waiter-orders-${restaurantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders, restaurantId]);

  useEffect(() => {
    if (readyOrders.length > prevReadyCount.current) {
      new Audio(READY_SFX).play().catch(() => {});
    }
    prevReadyCount.current = readyOrders.length;
  }, [readyOrders.length]);

  const handleValidate = async (order: PendingOrder) => {
    setProcessingId(order.id);
    await updateOrderStatus(order.id, "VALIDATED");
    setProcessingId(null);
  };

  const handleReject = async (order: PendingOrder) => {
    setProcessingId(order.id);
    await updateOrderStatus(order.id, "REJECTED");
    if (order.table_id) {
      const { data: remaining } = await supabase
        .from("orders")
        .select("id")
        .eq("table_id", order.table_id)
        .not("status", "in", '("REJECTED","DELIVERED")')
        .neq("id", order.id);
      if (!remaining?.length) {
        await supabase.from("tables").update({ status: "FREE" }).eq("id", order.table_id);
      }
    }
    setProcessingId(null);
  };

  const handleSaveNote = async (orderId: string) => {
    setSavingNoteId(orderId);
    await supabase.from("orders").update({ notes: notesByOrder[orderId] ?? "" }).eq("id", orderId);
    setSavingNoteId(null);
  };

  return {
    pendingOrders,
    readyOrders,
    loading,
    processingId,
    notesByOrder,
    savingNoteId,
    setNotesByOrder,
    handleValidate,
    handleReject,
    handleSaveNote,
  };
}
