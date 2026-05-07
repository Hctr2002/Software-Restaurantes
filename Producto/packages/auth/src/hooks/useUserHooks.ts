"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import { supabase, updateOrderStatus } from "../index";
import type { Order, TableRecord } from "../types";
import { mapTable, mapOrder } from "../utils";
import { useRealtimeSync } from "./useRealtimeSync";
import { useTables } from "./useTableHooks";
import { useRealtimeOrders } from "./useOrderHooks";

export function useRealtimeWaiterOrders(restaurantId: string | undefined) {
  const { tables, loading: tablesLoading } = useTables(restaurantId);
  const { orders, loading } = useRealtimeOrders(restaurantId, {
    statuses: ["PENDING", "VALIDATED", "PREPARING", "READY"],
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

  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const preparingOrders = orders.filter((o) => o.status === "VALIDATED" || o.status === "PREPARING");
  const readyOrders = orders.filter((o) => o.status === "READY");

  const handleValidate = async (orderId: string) => {
    setProcessingId(orderId);
    await updateOrderStatus(orderId, "VALIDATED");
    setProcessingId(null);
  };

  const handleReject = async (orderId: string, tableId?: string | null) => {
    setProcessingId(orderId);
    await updateOrderStatus(orderId, "REJECTED");
    if (tableId) {
      const { data: remaining } = await supabase
        .from("orders")
        .select("id")
        .eq("table_id", tableId)
        .not("status", "in", '("REJECTED","DELIVERED")')
        .neq("id", orderId);
      if (!remaining?.length) {
        await supabase.from("tables").update({ status: "FREE" }).eq("id", tableId);
      }
    }
    setProcessingId(null);
  };

  const handleSaveNote = async (orderId: string) => {
    setSavingNoteId(orderId);
    await supabase.from("orders").update({ notes: notesByOrder[orderId] ?? "" }).eq("id", orderId);
    setSavingNoteId(null);
  };

  const handleDeliver = async (orderId: string) => {
    await updateOrderStatus(orderId, "DELIVERED");
  };

  const handleTableClean = async (tableId: string) => {
    await supabase.from("tables").update({ status: "FREE" }).eq("id", tableId);
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
    pendingOrders,
    preparingOrders,
    readyOrders,
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
      channelId: `table-portal-${table.data?.id}`,
      filter: table.data?.id ? `id=eq.${table.data.id}` : undefined,
      transform: mapTable
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
    if (!table.data || order.cart.length === 0 || !restaurantId) return;
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
    } catch (err: any) {
      setOrder(p => ({ ...p, error: err.message }));
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
      channelId: `tracker-${orderId}`, 
      filter: `id=eq.${orderId}`,
      initialData: null 
    }
  );

  return { status: order?.status || null };
}
