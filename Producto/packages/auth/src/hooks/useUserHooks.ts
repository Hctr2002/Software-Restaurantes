"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import { supabase, updateOrderStatus } from "../index";
import type { Order, TableRecord } from "../types";
import { mapTable } from "../utils";
import { useRealtimeSync } from "./useRealtimeSync";
import { useTables } from "./useTableHooks";
import { useRealtimeOrders } from "./useOrderHooks";

function groupOrdersByTable(orders: Order[]): Order[] {
  const map = new Map<string, Order>();
  for (const order of orders) {
    const key = order.tableId ?? order.id;
    const existing = map.get(key);
    if (!existing) {
      const merged = { ...order, orderItems: [...(order.orderItems ?? [])] } as any;
      merged.order_items = [...(order.orderItems ?? [])];
      if (order.station === 'BAR') merged.barSubOrderId = order.id;
      else merged.kitchenSubOrderId = order.id;
      map.set(key, merged);
    } else {
      const newItems = order.orderItems ?? [];
      existing.orderItems = [...(existing.orderItems ?? []), ...newItems];
      (existing as any).order_items = existing.orderItems;
      const priority: Record<string, number> = { READY: 4, PREPARING: 3, VALIDATED: 2, PENDING: 1 };
      if ((priority[order.status] ?? 0) > (priority[existing.status] ?? 0)) {
        existing.status = order.status;
      }
      if (order.station === 'BAR') (existing as any).barSubOrderId = order.id;
      else if (order.station === 'KITCHEN') (existing as any).kitchenSubOrderId = order.id;
      if (order.station && existing.station && order.station !== existing.station) {
        existing.station = null;
      }
    }
  }
  return Array.from(map.values());
}

export function useRealtimeWaiterOrders(restaurantId: string | undefined) {
  const { tables, loading: tablesLoading } = useTables(restaurantId);
  const { orders, loading } = useRealtimeOrders(restaurantId, {
    statuses: ["PENDING", "VALIDATED", "PREPARING", "READY", "DELIVERED"],
    ascending: true
  });

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notesByOrder, setNotesByOrder] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (orders.length > 0) {
      const initialNotes: Record<string, string> = {};
      orders.forEach((o) => {
        if (o.notes) initialNotes[o.id] = o.notes;
      });
      setNotesByOrder((prev) => ({ ...initialNotes, ...prev }));
    }
  }, [orders]);

  const pendingOrders   = useMemo(() => groupOrdersByTable(orders.filter((o) => o.status === "PENDING")), [orders]);
  const preparingOrders = useMemo(() => groupOrdersByTable(orders.filter((o) => o.status === "VALIDATED" || o.status === "PREPARING")), [orders]);
  const readyOrders     = useMemo(() => groupOrdersByTable(orders.filter((o) => o.status === "READY")), [orders]);
  const partiallyReadyOrders: Order[] = [];

  const handleValidate = async (orderId: string, note?: string, barOrderId?: string, barNote?: string) => {
    setProcessingId(orderId);
    const order = orders.find((o) => o.id === orderId);
    if (note?.trim()) {
      await supabase.from("orders").update({ notes: note.trim() }).eq("id", orderId);
    }
    if (barOrderId && barNote?.trim()) {
      await supabase.from("orders").update({ notes: barNote.trim() }).eq("id", barOrderId);
    }
    // Validate all PENDING sub-orders for the same table in one batch
    if (order?.tableId) {
      await supabase
        .from("orders")
        .update({ status: "VALIDATED", validated_at: new Date().toISOString() })
        .eq("table_id", order.tableId)
        .eq("status", "PENDING");
    } else {
      await updateOrderStatus(orderId, "VALIDATED");
    }
    setProcessingId(null);
  };

  const handleReject = async (orderId: string, tableId?: string | null) => {
    setProcessingId(orderId);
    const order = orders.find((o) => o.id === orderId);
    const tid = tableId ?? order?.tableId;
    if (tid) {
      // Reject all PENDING/VALIDATED sub-orders for the same table
      await supabase
        .from("orders")
        .update({ status: "REJECTED" })
        .eq("table_id", tid)
        .in("status", ["PENDING", "VALIDATED"]);
      const { data: remaining } = await supabase
        .from("orders")
        .select("id")
        .eq("table_id", tid)
        .not("status", "in", '("REJECTED","DELIVERED","COMPLETED")');
      if (!remaining?.length) {
        await supabase.from("tables").update({ status: "FREE" }).eq("id", tid);
      }
    } else {
      await updateOrderStatus(orderId, "REJECTED");
    }
    setProcessingId(null);
  };

  const handleSaveNote = async (orderId: string) => {
    setSavingNoteId(orderId);
    await supabase.from("orders").update({ notes: notesByOrder[orderId] ?? "" }).eq("id", orderId);
    setSavingNoteId(null);
  };

  const handleSaveBarNote = async (barOrderId: string) => {
    setSavingNoteId(barOrderId);
    await supabase.from("orders").update({ notes: notesByOrder[barOrderId] ?? "" }).eq("id", barOrderId);
    setSavingNoteId(null);
  };

  const handleDeliver = async (orderId: string, order?: any) => {
    const tableId = order?.tableId ?? orders.find((o) => o.id === orderId)?.tableId;
    if (tableId) {
      await supabase.from("orders")
        .update({ status: "DELIVERED" })
        .eq("table_id", tableId)
        .eq("status", "READY");
    } else {
      await updateOrderStatus(orderId, "DELIVERED");
    }
  };

  const handleTableClean = async (tableId: string) => {
    try {
      const { error } = await supabase.from("tables").update({ status: "FREE", current_session_id: null }).eq("id", tableId);
      if (error) {
        console.error("Error cleaning table:", error);
        alert(`Error al limpiar mesa: ${error.message}`);
      }
    } catch (err: any) {
      console.error("Critical error cleaning table:", err);
      alert(`Error crítico al limpiar mesa: ${err.message || 'Revisa la consola'}`);
    }
  };

  const handleHelpComplete = async (tableId: string) => {
    await supabase.from("tables").update({ help_requested: false }).eq("id", tableId);
  };

  const billRequestedTableIds = useMemo(() => new Set(tables.filter((t) => t.billRequested).map((t) => t.id)), [tables]);
  const helpRequestedTableIds = useMemo(() => new Set(tables.filter((t) => t.helpRequested).map((t) => t.id)), [tables]);
  const helpRequestedTables = useMemo(() => tables.filter((t) => t.helpRequested), [tables]);
  const readyTableIds = useMemo(() => new Set(readyOrders.map((o) => o.tableId).filter(Boolean)), [readyOrders]);
  const preparingTableIds = useMemo(() => new Set(preparingOrders.map((o) => o.tableId).filter(Boolean)), [preparingOrders]);
  const cleaningTables = useMemo(() => tables.filter((t) => t.status === "CLEANING"), [tables]);

  return {
    orders,
    pendingOrders,
    preparingOrders,
    readyOrders,
    partiallyReadyOrders,
    tables,
    billRequestedTableIds,
    helpRequestedTableIds,
    helpRequestedTables,
    readyTableIds,
    preparingTableIds,
    cleaningTables,
    loading: loading || tablesLoading,
    processingId,
    notesByOrder,
    savingNoteId,
    setNotesByOrder,
    handleValidate,
    handleReject,
    handleSaveNote,
    handleSaveBarNote,
    handleDeliver,
    handleTableClean,
    handleHelpComplete,
  };
}

export function useCustomerPortal(restaurantId: string | undefined, tableNumber?: string) {
  const [table, setTable] = useState({
    input: tableNumber ?? "",
    data: null as TableRecord | null,
    loading: false,
    error: null as string | null
  });

  const [order, setOrder] = useState({
    cart: [] as any[],
    placing: false,
    success: false,
    error: null as string | null,
    lastId: null as string | null
  });

  const validateTable = useCallback(async (numStr: string) => {
    const num = parseInt(numStr);
    if (!numStr || isNaN(num) || num <= 0 || !restaurantId) {
      setTable(p => ({ ...p, data: null, error: null }));
      return;
    }

    setTable(p => ({ ...p, loading: true, error: null }));
    try {
      const { data, error } = await supabase.from("tables").select("*")
        .eq("restaurant_id", restaurantId).eq("number", num).single();

      if (error || !data) {
        setTable(p => ({ ...p, error: `Mesa ${num} no existe`, data: null }));
      } else {
        setTable(p => ({ ...p, data: mapTable(data) }));
      }
    } catch {
      setTable(p => ({ ...p, error: "Error de validación" }));
    } finally {
      setTable(p => ({ ...p, loading: false }));
    }
  }, [restaurantId]);

  const { data: realtimeTable } = useRealtimeSync<TableRecord | null>(
    restaurantId,
    "tables",
    useCallback(async () => {
      if (!table.data?.id) return { data: null, error: null };
      const { data, error } = await supabase.from("tables").select("*").eq("id", table.data.id).single();
      return { data, error };
    }, [table.data?.id]),
    {
      channelId: `table-portal-${table.data?.id ?? "none"}`,
      filter: table.data?.id ? `id=eq.${table.data.id}` : undefined,
      transform: (data: any) => data ? mapTable(data) : null,
    }
  );

  useEffect(() => {
    if (realtimeTable && realtimeTable.status === "FREE") {
      setOrder(p => ({ ...p, cart: [], success: false, lastId: null, error: null }));
      setTable(p => ({ ...p, data: realtimeTable }));
    } else if (realtimeTable) {
      setTable(p => ({ ...p, data: realtimeTable }));
    }
  }, [realtimeTable]);

  useEffect(() => { if (tableNumber) validateTable(tableNumber); }, [tableNumber, validateTable]);

  const updateCart = (item: any, delta: number) => {
    setOrder(p => {
      const existing = p.cart.find(i => i.id === item.id);
      if (delta > 0) {
        if (existing) return { ...p, cart: p.cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + delta } : i) };
        return { ...p, cart: [...p.cart, { ...item, quantity: 1 }] };
      }
      return { ...p, cart: p.cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0) };
    });
  };

  const placeOrder = async () => {
    if (!table.data || order.cart.length === 0 || !restaurantId) return false;
    setOrder(p => ({ ...p, placing: true, error: null }));

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          table_id:      table.data.id,
          total_amount:  totals.total,
          items:         order.cart.map(c => ({
            menu_item_id: c.id,
            quantity:     c.quantity,
            unit_price:   c.price
          }))
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error al procesar el pedido");

      setOrder(p => ({ ...p, lastId: result.id, cart: [], success: true }));
      return true;
    } catch (err: any) {
      setOrder(p => ({ ...p, error: err.message }));
      return false;
    } finally {
      setOrder(p => ({ ...p, placing: false }));
    }
  };

  const totals = useMemo(() => ({
    count: order.cart.reduce((a, b) => a + b.quantity, 0),
    total: order.cart.reduce((a, b) => a + b.price * b.quantity, 0)
  }), [order.cart]);

  return {
    table, setTableInput: (v: string) => setTable(p => ({ ...p, input: v })),
    validateTable,
    order, setOrderSuccess: (v: boolean) => setOrder(p => ({ ...p, success: v })),
    addToCart: (i: any) => updateCart(i, 1),
    removeFromCart: (id: string) => updateCart({ id }, -1),
    cartCount: totals.count,
    cartTotal: totals.total,
    placeOrder,
    resetOrder: () => setOrder(p => ({ ...p, success: false, lastId: null, error: null })),
  };
}

export function useCustomerOrderTracker(orderId: string | null) {
  const fetchFn = useCallback(async () => {
    if (!orderId) return { data: null, error: null };
    return supabase.from("orders").select("status").eq("id", orderId).single();
  }, [orderId]);

  const { data: order } = useRealtimeSync<{ status: string } | null>(
    undefined,
    "orders",
    fetchFn,
    {
      channelId: `tracker-${orderId ?? "none"}`,
      filter: orderId ? `id=eq.${orderId}` : undefined,
      initialData: null
    }
  );

  return { status: order?.status || null };
}
