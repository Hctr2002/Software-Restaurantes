import { useEffect, useState } from "react";
import { supabase } from "./index";

export function useTables(restaurantId: string | undefined) {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    const fetchTables = async () => {
      try {
        const { data, error } = await supabase
          .from("tables")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .order("number", { ascending: true });

        if (!error && data) setTables(data);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();

    const channel = supabase
      .channel("table_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tables", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setTables((current) =>
              current.map((t) => (t.id === payload.new.id ? payload.new : t))
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  return { tables, loading };
}

export function useMenu(restaurantId: string | undefined) {
  const [menu, setMenu] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    const fetchMenuData = async () => {
      try {
        const [menuRes, catRes] = await Promise.all([
          supabase.from("menu_items").select("*").eq("restaurant_id", restaurantId).eq("is_active", true),
          supabase.from("categories").select("*").eq("restaurant_id", restaurantId).eq("is_active", true),
        ]);

        if (!menuRes.error && menuRes.data) setMenu(menuRes.data);
        if (!catRes.error && catRes.data) setCategories(catRes.data);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, [restaurantId]);

  return { menu, categories, loading };
}

export function useKitchenOrders(restaurantId: string | undefined) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            table:tables(number),
            items:order_items(
              *,
              menu_item:menu_items(name)
            )
          `)
          .eq("restaurant_id", restaurantId)
          .neq("status", "DELIVERED")
          .order("createdAt", { ascending: true });

        if (!error && data) setOrders(data);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    const channel = supabase
      .channel("kitchen_order_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        () => { fetchOrders(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  return { orders, loading };
}

export function useWaiterOrders(restaurantId: string | undefined) {
  const [pending, setPending] = useState<any[]>([]);
  const [ready, setReady]     = useState<any[]>([]);

  useEffect(() => {
    if (!restaurantId) return;

    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`
            id, status, created_at,
            table:tables(number),
            items:order_items(quantity, menu_item:menu_items(name))
          `)
          .eq("restaurant_id", restaurantId)
          .in("status", ["PENDING", "READY"])
          .order("createdAt", { ascending: true });

        if (!error && data) {
          setPending(data.filter((o: any) => o.status === "PENDING"));
          setReady(data.filter((o: any)   => o.status === "READY"));
        }
      } catch (_) {
        // silently ignore — secciones no renderizan si no hay datos
      }
    };

    fetchOrders();

    const channel = supabase
      .channel("waiter_order_feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        () => { fetchOrders(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  return { pending, ready };
}
