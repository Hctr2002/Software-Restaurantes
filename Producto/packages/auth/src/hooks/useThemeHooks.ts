"use client";

import { useCallback } from "react";
import { getRestaurantTheme } from "../index";
import { useRealtimeSync } from "./useRealtimeSync";

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
