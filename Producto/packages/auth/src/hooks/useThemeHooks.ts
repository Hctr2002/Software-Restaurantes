"use client";

/**
 * useThemeHooks — Hook de sincronización de tema del restaurante.
 * useThemeSync: retorna el tema activo y lo actualiza en tiempo real ante cambios
 * en la tabla restaurant_themes. Usado por los ThemeWrapper de cada app operacional.
 */

import { useCallback } from "react";
import { getRestaurantTheme } from "../index";
import { useRealtimeSync } from "./useRealtimeSync";
import { RestaurantTheme } from "../types";

export function useThemeSync(restaurantId: string | undefined, channelPrefix: string = "default"): RestaurantTheme | null {
  const fetchFn = useCallback(async () => {
    if (!restaurantId) return { data: null, error: null };
    const theme = await getRestaurantTheme(restaurantId);
    return { data: theme, error: null };
  }, [restaurantId]);

  const { data: theme } = useRealtimeSync<RestaurantTheme | null>(
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
