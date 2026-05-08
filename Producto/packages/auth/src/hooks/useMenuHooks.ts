"use client";

import { useCallback } from "react";
import { supabase } from "../index";
import type { MenuItem, Category } from "../types";
import { mapMenuItem, mapCategory } from "../utils";
import { useRealtimeSync } from "./useRealtimeSync";

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
