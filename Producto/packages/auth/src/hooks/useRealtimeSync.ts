"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "../index";

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
    try {
      const { data: res, error } = await fetchFn();
      if (!error && res) {
        setData(transform ? (Array.isArray(res) ? res.map(transform) : transform(res)) as any : res);
      }
    } catch (e) {
      console.error(`[Realtime] Error in performFetch for ${tableName}:`, e);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, transform, tableName]);

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
