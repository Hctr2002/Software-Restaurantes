"use client";

/**
 * useMenuHooks — Hooks de menú y categorías en tiempo real.
 * useMenu: retorna los ítems activos y categorías activas del restaurante,
 * ambos suscritos a cambios en tiempo real vía useRealtimeSync.
 */

import { useCallback } from "react";
import { supabase } from "../index";
import type { MenuItem, Category } from "../types";
import { mapMenuItem, mapCategory } from "../utils";
import { useRealtimeSync } from "./useRealtimeSync";

/**
 * Retorna los ítems activos y categorías activas del restaurante suscritos en tiempo real.
 * Aplica mapMenuItem / mapCategory para convertir snake_case a camelCase.
 */
export function useMenu(restaurantId: string | undefined) {
  const fetchMenu = useCallback(async () => {
    if (!restaurantId) return { data: [], error: null };
    return supabase.from("menu_items").select("*").eq("restaurant_id", restaurantId).eq("is_active", true);
  }, [restaurantId]);

  const fetchCats = useCallback(async () => {
    if (!restaurantId) return { data: [], error: null };
    return supabase.from("categories").select("*").eq("restaurant_id", restaurantId).eq("is_active", true);
  }, [restaurantId]);

  const { data: menu, loading: menuLoading } = useRealtimeSync<MenuItem[]>(restaurantId, "menu_items", fetchMenu, { transform: (data: any) => Array.isArray(data) ? data.map(mapMenuItem) : [] });
  const { data: categories, loading: catLoading } = useRealtimeSync<Category[]>(restaurantId, "categories", fetchCats, { transform: (data: any) => Array.isArray(data) ? data.map(mapCategory) : [] });

  return { menu, categories, loading: menuLoading || catLoading };
}
