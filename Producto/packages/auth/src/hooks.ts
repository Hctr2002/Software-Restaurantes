"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase, updateOrderStatus, sendAlert, getRestaurantTheme } from "./index";
import type { AlertType, Order, TableRecord, Alert, StatsData } from "./types";

/**
 * Generic hook for fetching data and keeping it in sync with Supabase Realtime.
 * T can be an array or a single object.
 */
export function useRealtimeSync<T>(
  restaurantId: string | undefined,
  tableName: string,
  fetchFn: () => Promise<{ data: T | null; error: any }>,
  options: { channelId?: string; filter?: string; initialData?: T } = {}
) {
  const { channelId, filter, initialData = (tableName === 'orders' || tableName === 'tables' ? [] : null) as any } = options;
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);

  const performFetch = useCallback(async () => {
    const { data: res, error } = await fetchFn();
    if (!error) setData(res as T);
    setLoading(false);
  }, [fetchFn]);

  useEffect(() => {
    performFetch();
    const f = filter || (restaurantId ? `restaurant_id=eq.${restaurantId}` : undefined);
    if (!f) return;

    const name = `${tableName}-sync-${restaurantId ?? "global"}${channelId ? `-${channelId}` : ""}`;
    const channel = supabase.channel(name)
      .on("postgres_changes", { event: "*", schema: "public", table: tableName, filter: f }, performFetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, performFetch, tableName, channelId, filter]);

  return { data, loading, setData, refetch: performFetch };
}

export function useTables(restaurantId: string | undefined) {
  const fetchFn = useCallback(async () => {
    return supabase
      .from("tables")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("number", { ascending: true });
  }, [restaurantId]);

  const { data: tables, loading, refetch } = useRealtimeSync<TableRecord[]>(
    restaurantId, 
    "tables", 
    fetchFn
  );

  return { tables, loading, refetch };
}

export function useMenu(restaurantId: string | undefined) {
  const fetchMenu = useCallback(async () => {
    return supabase.from("menu_items").select("*").eq("restaurant_id", restaurantId).eq("is_active", true);
  }, [restaurantId]);
  
  const fetchCats = useCallback(async () => {
    return supabase.from("categories").select("*").eq("restaurant_id", restaurantId).eq("is_active", true);
  }, [restaurantId]);

  const { data: menu, loading: menuLoading } = useRealtimeSync<any[]>(restaurantId, "menu_items", fetchMenu);
  const { data: categories, loading: catLoading } = useRealtimeSync<any[]>(restaurantId, "categories", fetchCats);

  return { menu, categories, loading: menuLoading || catLoading };
}

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
    { channelId: `orders-${statusesStr}` }
  );

  return { orders, loading, refetch };
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
    { channelId: "stats", initialData: null }
  );

  return { stats, loading, refetch };
}

export function useRealtimeAlerts(restaurantId: string | undefined) {
  const fetchFn = useCallback(async () => {
    return supabase
      .from("alerts")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(20);
  }, [restaurantId]);

  const { data: alerts, loading, refetch } = useRealtimeSync<Alert[]>(
    restaurantId,
    "alerts",
    fetchFn
  );

  return { alerts, loading, refetch };
}

export function useKitchenOrders(restaurantId: string | undefined) {
  const { orders, loading, refetch } = useRealtimeOrders(restaurantId, {
    statuses: ["VALIDATED", "PREPARING", "READY"],
    ascending: true,
    limit: 100
  });

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === "VALIDATED"), [orders]);
  const preparingOrders = useMemo(() => orders.filter((o) => o.status === "PREPARING"), [orders]);
  const readyOrders = useMemo(() => orders.filter((o) => o.status === "READY"), [orders]);

  return {
    orders,
    pendingOrders,
    preparingOrders,
    readyOrders,
    loading,
    refetch
  };
}


export function useCashierOrders(restaurantId: string | undefined) {
  const [history, setHistory] = useState<any[]>([]);
  
  const fetchFn = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`*, table:tables(number), order_items(*, menu_items(name))`)
      .eq("restaurant_id", restaurantId)
      .eq("status", "READY")
      .order("createdAt", { ascending: true });
    
    // Also fetch history in the same "sync" cycle but separately
    // Use ISO string for today 00:00:00 to avoid timezone issues with Supabase
    const todayStr = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    
    const { data: historyData } = await supabase
      .from("orders")
      .select(`*, table:tables(number), order_items(*, menu_items(name))`)
      .eq("restaurant_id", restaurantId)
      .eq("status", "DELIVERED")
      .gte("createdAt", todayStr)
      .order("createdAt", { ascending: false })
      .limit(50);
    
    if (historyData) setHistory(historyData);
    
    return { data, error };
  }, [restaurantId]);

  const { data: orders, loading, refetch } = useRealtimeSync<any[]>(
    restaurantId,
    "orders",
    fetchFn,
    { channelId: "cashier-orders" }
  );

  const [isProcessing, setIsProcessing] = useState(false);

  const markDelivered = async (orderIds: string[], tableId?: string, paymentReference?: string, userId?: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: "DELIVERED", 
          user_id: userId, 
          payment_reference: paymentReference || null 
        })
        .in("id", orderIds)
        .eq("status", "READY");

      if (error) throw error;

      if (tableId) {
        await supabase
          .from("tables")
          .update({ status: "CLEANING", bill_requested: false })
          .eq("id", tableId);
      }

      await refetch();
      return { success: true };
    } catch (err) {
      console.error("Error in markDelivered:", err);
      return { success: false, error: err };
    } finally {
      setIsProcessing(false);
    }
  };

  return { orders, history, loading, refetch, markDelivered, isProcessing };
}

export const useTableStatus = useTables;

export function useCustomerOrderTracker(orderId: string | null) {
  const fetchFn = useCallback(async () => {
    if (!orderId) return { data: null, error: "No order ID" };
    const { data } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();
    return { data: data?.status || "PENDING", error: null };
  }, [orderId]);

  const { data: status, loading } = useRealtimeSync<string>(
    undefined,
    "orders",
    fetchFn,
    { 
      channelId: `tracker-${orderId}`, 
      filter: `id=eq.${orderId}`,
      initialData: "PENDING"
    }
  );

  return { status, loading };
}

export function useTableOrders(tableId: string | undefined) {
  const fetchFn = useCallback(async () => {
    if (!tableId) return { data: [], error: null };
    return supabase
      .from("orders")
      .select(`
        *,
        items:order_items(*, menu_item:menu_items(name))
      `)
      .eq("table_id", tableId)
      .not("status", "in", '("REJECTED")')
      .order("createdAt", { ascending: false });
  }, [tableId]);

  const { data: orders, loading, refetch } = useRealtimeSync<any[]>(
    undefined,
    "orders",
    fetchFn,
    { 
      channelId: `table-orders-${tableId}`,
      filter: `table_id=eq.${tableId}`
    }
  );

  return { orders, loading, refetch };
}

export function useAlertForm(restaurantId: string | undefined, userId: string | undefined, userEmail: string | undefined) {
  const [form, setForm] = useState({
    type: "HELP_REQUEST" as AlertType,
    msg: "",
    table: "",
    sending: false,
    sent: false
  });

  const handleSendAlert = async (): Promise<boolean> => {
    if (!form.msg.trim() || !restaurantId) return false;
    setForm(p => ({ ...p, sending: true }));
    const { error } = await sendAlert({
      restaurantId, userId: userId ?? "", userEmail: userEmail ?? "",
      type: form.type, message: form.msg.trim(),
      tableNumber: form.table ? parseInt(form.table) : undefined,
    });
    setForm(p => ({ ...p, sending: false, sent: !error }));
    if (!error) {
      setTimeout(() => setForm({ type: "HELP_REQUEST", msg: "", table: "", sending: false, sent: false }), 1500);
    }
    return !error;
  };

  const reset = () => setForm({ type: "HELP_REQUEST", msg: "", table: "", sending: false, sent: false });

  return {
    alertType: form.type, setAlertType: (type: AlertType) => setForm(p => ({ ...p, type })),
    alertMsg: form.msg, setAlertMsg: (msg: string) => setForm(p => ({ ...p, msg })),
    tableNum: form.table, setTableNum: (table: string) => setForm(p => ({ ...p, table })),
    sendingAlert: form.sending, alertSent: form.sent,
    handleSendAlert, reset,
  };
}

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

  const billRequestedTableIds = useMemo(() => new Set(tables.filter((t) => t.bill_requested).map((t) => t.id)), [tables]);
  const readyTableIds = useMemo(() => new Set(readyOrders.map((o) => o.table_id).filter(Boolean)), [readyOrders]);
  const preparingTableIds = useMemo(() => new Set(preparingOrders.map((o) => o.table_id).filter(Boolean)), [preparingOrders]);
  const cleaningTables = useMemo(() => tables.filter((t) => t.status === "CLEANING"), [tables]);

  return {
    pendingOrders,
    preparingOrders,
    readyOrders,
    tables,
    billRequestedTableIds,
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
  };
}

export function useThemeSync(restaurantId: string | undefined, channelPrefix: string = "default") {
  const fetchFn = useCallback(async () => {
    if (!restaurantId) return { data: null, error: "No restaurant ID" };
    const theme = await getRestaurantTheme(restaurantId);
    return { data: theme, error: null };
  }, [restaurantId]);

  const { data: theme } = useRealtimeSync<any>(
    restaurantId,
    "restaurant_themes",
    fetchFn,
    { 
      channelId: `${channelPrefix}-theme`, 
      initialData: null 
    }
  );

  return theme;
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
        setTable(p => ({ ...p, data: data as TableRecord }));
      }
    } catch {
      setTable(p => ({ ...p, error: "Error de validación" }));
    } finally {
      setTable(p => ({ ...p, loading: false }));
    }
  }, [restaurantId]);

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
      const { data: ord, error: oErr } = await supabase.from("orders")
        .insert({ restaurant_id: restaurantId, table_id: table.data.id, status: "PENDING" })
        .select().single();
      if (oErr) throw oErr;

      const items = order.cart.map(c => ({ order_id: ord.id, menu_item_id: c.id, quantity: c.quantity, unit_price: c.price }));
      const { error: iErr } = await supabase.from("order_items").insert(items);
      if (iErr) throw iErr;

      if (table.data.status === "FREE") {
        await supabase.from("tables").update({ status: "OCCUPIED" }).eq("id", table.data.id);
      }

      setOrder(p => ({ ...p, lastId: ord.id, cart: [], success: true }));
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
