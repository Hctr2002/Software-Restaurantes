"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase, updateOrderStatus, sendAlert, getRestaurantTheme } from "./index";
import type { AlertType, Order, TableRecord, Alert, StatsData, MenuItem, Category, Role } from "./types";
import { mapMenuItem, mapTable, mapOrder, mapCategory } from "./utils";

/**
 * Generic hook for fetching data and keeping it in sync with Supabase Realtime.
 * T can be an array or a single object.
 */
export function useRealtimeSync<T>(
  restaurantId: string | undefined,
  tableName: string,
  fetchFn: () => Promise<{ data: T | null; error: any }>,
  options: { 
    channelId?: string; 
    filter?: string; 
    initialData?: T;
    transform?: (data: any) => any;
  } = {}
) {
  const { channelId, filter, initialData = (['orders', 'tables', 'menu_items', 'categories', 'alerts'].includes(tableName) ? [] : null) as any, transform } = options;
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);

  const performFetch = useCallback(async () => {
    const { data: res, error } = await fetchFn();
    if (!error && res) {
      setData(transform ? (Array.isArray(res) ? res.map(transform) : transform(res)) as any : res);
    }
    setLoading(false);
  }, [fetchFn, transform]);

  useEffect(() => {
    performFetch();
    const f = filter || (restaurantId ? `restaurant_id=eq.${restaurantId}` : undefined);
    if (!f) return;

    const name = `${tableName}-sync-${restaurantId ?? "global"}${channelId ? `-${channelId}` : ""}`;
    console.log(`[Realtime] Initializing channel: ${name} for table ${tableName}`);
    
    const channel = supabase.channel(name)
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: tableName, 
        filter: f 
      }, (payload) => {
        console.log(`[Realtime] Change detected on ${tableName}:`, payload.eventType);
        performFetch();
      })
      .subscribe((status) => {
        console.log(`[Realtime] Subscription status for ${name}:`, status);
        if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] Error in channel ${name}. Check if table has Realtime enabled.`);
        }
      });

    return () => { 
      console.log(`[Realtime] Cleaning up channel: ${name}`);
      supabase.removeChannel(channel); 
    };
  }, [restaurantId, performFetch, tableName, channelId, filter]);

  return { data, loading, setData, refetch: performFetch };
}

export function useTable(tableId: string | undefined) {
  const fetchFn = useCallback(async () => {
    if (!tableId) return { data: null, error: "No table ID" };
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
      filter: `id=eq.${tableId}`,
      transform: mapTable
    }
  );

  return { table, loading, refetch };
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
    fetchFn,
    { transform: mapTable }
  );

  return { tables, loading, refetch };
}

export const useTableStatus = useTables;

export function useMenu(restaurantId: string | undefined) {
  const fetchMenu = useCallback(async () => {
    return supabase.from("menu_items").select("*").eq("restaurant_id", restaurantId).eq("is_active", true);
  }, [restaurantId]);
  
  const fetchCats = useCallback(async () => {
    return supabase.from("categories").select("*").eq("restaurant_id", restaurantId).eq("is_active", true);
  }, [restaurantId]);

  const { data: menu, loading: menuLoading } = useRealtimeSync<MenuItem[]>(restaurantId, "menu_items", fetchMenu, { transform: mapMenuItem });
  const { data: categories, loading: catLoading } = useRealtimeSync<Category[]>(restaurantId, "categories", fetchCats, { transform: mapCategory });

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
    { 
      channelId: `orders-${statusesStr}`,
      transform: mapOrder
    }
  );

  return { orders, loading, refetch };
}

export function useKitchenOrders(restaurantId: string | undefined) {
  return useRealtimeOrders(restaurantId, {
    statuses: ["VALIDATED", "PREPARING", "READY"],
    ascending: true
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

export function useRealtimeAlerts(restaurantId: string | undefined) {
  const fetchFn = useCallback(async () => {
    return supabase
      .from("alerts")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("isRead", false)
      .order("createdAt", { ascending: false });
  }, [restaurantId]);

  const { data: alerts, loading, refetch } = useRealtimeSync<Alert[]>(
    restaurantId,
    "alerts",
    fetchFn
  );

  return { alerts, loading, refetch };
}

export function useAlertForm(restaurantId: string | undefined, userId?: string, userEmail?: string) {
  const [form, setForm] = useState({
    type: "HELP" as AlertType,
    msg: "",
    table: "",
    sending: false,
    sent: false,
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
      setTimeout(() => setForm({ type: "HELP", msg: "", table: "", sending: false, sent: false }), 1500);
    }
    return !error;
  };

  const reset = () => setForm({ type: "HELP", msg: "", table: "", sending: false, sent: false });

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

  const billRequestedTableIds = useMemo(() => new Set(tables.filter((t) => t.billRequested).map((t) => t.id)), [tables]);
  const readyTableIds = useMemo(() => new Set(readyOrders.map((o) => o.tableId).filter(Boolean)), [readyOrders]);
  const preparingTableIds = useMemo(() => new Set(preparingOrders.map((o) => o.tableId).filter(Boolean)), [preparingOrders]);
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
      .not("status", "in", '("REJECTED","COMPLETED")')
      .order("createdAt", { ascending: false });
  }, [tableId]);

  const { data: orders, loading, refetch } = useRealtimeSync<Order[]>(
    undefined,
    "orders",
    fetchFn,
    { 
      channelId: `table-orders-${tableId}`,
      filter: `table_id=eq.${tableId}`,
      transform: mapOrder
    }
  );

  return { orders, loading, refetch };
}

export function useCashierOrders(restaurantId: string | undefined) {
  const [history, setHistory] = useState<Order[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fetchFn = useCallback(async () => {
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
      transform: mapOrder
    }
  );

  const markDelivered = async (orderIds: string[], tableId: string | null, reference: string, userId?: string) => {
    setIsProcessing(true);
    try {
      const { error: oErr } = await supabase
        .from("orders")
        .update({ 
          status: "COMPLETED", 
          notes: reference ? `Ref: ${reference}` : "Pagado en Caja",
        })
        .in("id", orderIds);
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
