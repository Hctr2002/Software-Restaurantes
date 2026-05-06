"use client";

import { useEffect, useState } from "react";
import { supabase, getRestaurantTheme } from "@menu-bites/auth";

type Theme = Awaited<ReturnType<typeof getRestaurantTheme>>;

export function useThemeSync(restaurantId: string | undefined, channelPrefix: string) {
  const [theme, setTheme] = useState<Theme>(null);

  useEffect(() => {
    if (!restaurantId) return;
    getRestaurantTheme(restaurantId).then(setTheme);

    const channel = supabase
      .channel(`${channelPrefix}-theme-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "restaurant_themes", filter: `restaurant_id=eq.${restaurantId}` },
        async (payload) => { if (payload.new.is_active) setTheme(await getRestaurantTheme(restaurantId)); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, channelPrefix]);

  return theme;
}
