"use client";

import { useEffect, useState } from "react";
import { supabase } from "./index";

export function useTables(restaurantId: string | undefined) {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;

    const fetchTables = async () => {
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("number", { ascending: true });

      if (!error) setTables(data);
      setLoading(false);
    };

    fetchTables();

    // Suscripción real-time para cambios en mesas
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  return { tables, loading };
}

export function useMenu(restaurantId: string | undefined) {
  const [menu, setMenu] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;

    const fetchMenuData = async () => {
      const [menuRes, catRes] = await Promise.all([
        supabase.from("menu_items").select("*").eq("restaurant_id", restaurantId).eq("is_active", true),
        supabase.from("categories").select("*").eq("restaurant_id", restaurantId).eq("is_active", true),
      ]);

      if (!menuRes.error) setMenu(menuRes.data);
      if (!catRes.error) setCategories(catRes.data);
      setLoading(false);
    };

    fetchMenuData();
  }, [restaurantId]);

  return { menu, categories, loading };
}

export function useKitchenOrders(restaurantId: string | undefined) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;

    const fetchOrders = async () => {
      // Traer órdenes que no estén DELIVERED
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
        .in("status", ["VALIDATED", "PREPARING", "READY"])
        .order("createdAt", { ascending: true });

      if (!error) setOrders(data);
      setLoading(false);
    };

    fetchOrders();

    const channel = supabase
      .channel("kitchen_order_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          fetchOrders(); // Recargar todo para traer las relaciones (items/tables) simplifica la lógica
          // Notificación sonora gestionada en el componente
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  return { orders, loading };
}
