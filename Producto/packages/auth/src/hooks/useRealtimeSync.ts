"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../index";

const MAX_RETRIES = 5;

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
  const [retryCount, setRetryCount] = useState(0);

  const transformRef = useRef(transform);
  transformRef.current = transform;

  // Tracks whether the current cleanup is intentional (we called removeChannel)
  // vs an unexpected server-side close that warrants reconnection.
  const intentionalCloseRef = useRef(false);

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
  }, [fetchFn, tableName]);

  useEffect(() => {
    const hasScope = restaurantId || filter;
    if (hasScope) {
      performFetch();
    } else {
      setLoading(false);
    }

    const f = filter || (restaurantId ? `restaurant_id=eq.${restaurantId}` : undefined);
    if (!f) return;

    intentionalCloseRef.current = false;

    const name = `${tableName}-sync-${restaurantId ?? "global"}${channelId ? `-${channelId}` : ""}-r${retryCount}`;
    const channel = supabase.channel(name)
      .on("postgres_changes", { event: "*", schema: "public", table: tableName, filter: f },
        () => { performFetch(); })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && retryCount < MAX_RETRIES) {
          console.error(`[Realtime] Channel error on ${tableName} (intento ${retryCount + 1}/${MAX_RETRIES}), reconectando…`);
          setTimeout(() => setRetryCount((c) => c + 1), Math.min(3000 * 2 ** retryCount, 30000));
        }
        if (status === 'TIMED_OUT' && retryCount < MAX_RETRIES) {
          console.warn(`[Realtime] Timeout en ${tableName} (intento ${retryCount + 1}/${MAX_RETRIES}), reconectando…`);
          setTimeout(() => setRetryCount((c) => c + 1), Math.min(2000 * 2 ** retryCount, 30000));
        }
        // CLOSED is normal when we call removeChannel — only reconnect if unexpected
        if (status === 'CLOSED' && !intentionalCloseRef.current && retryCount < MAX_RETRIES) {
          console.warn(`[Realtime] Cierre inesperado en ${tableName} (intento ${retryCount + 1}/${MAX_RETRIES}), reconectando…`);
          setTimeout(() => setRetryCount((c) => c + 1), 2000);
        }
      });

    return () => {
      intentionalCloseRef.current = true;
      supabase.removeChannel(channel);
    };
  }, [restaurantId, performFetch, tableName, channelId, filter, retryCount]);

  return { data, loading, setData, refetch: performFetch };
}
