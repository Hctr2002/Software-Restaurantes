"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../index";

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

  // Keep transform in a ref so it never causes performFetch to be recreated
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const performFetch = useCallback(async () => {
    try {
      const { data: res, error } = await fetchFn();
      if (error) {
        console.error(`[Realtime] Fetch error for ${tableName}:`, error);
        return;
      }
      if (res !== undefined && res !== null) {
        setData(transformRef.current ? transformRef.current(res) : res);
      }
    } catch (err) {
      console.error(`[Realtime] Critical error in performFetch for ${tableName}:`, err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, tableName]); // transform removed from deps — stable via ref

  useEffect(() => {
    const hasScope = restaurantId || filter;
    if (hasScope) {
      performFetch();
    } else {
      setLoading(false);
    }

    const f = filter || (restaurantId ? `restaurant_id=eq.${restaurantId}` : undefined);
    if (!f) return;

    const name = `${tableName}-sync-${restaurantId ?? "global"}${channelId ? `-${channelId}` : ""}`;
    const channel = supabase.channel(name)
      .on("postgres_changes", { event: "*", schema: "public", table: tableName, filter: f },
        () => { performFetch(); })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] Channel error on ${tableName}`);
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, performFetch, tableName, channelId, filter]);

  return { data, loading, setData, refetch: performFetch };
}
