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

    // Local flag per effect invocation — each closure captures its own copy,
    // eliminating the race condition caused by a shared ref.
    let intentionallyClosed = false;

    // Sanitize channelId: remove chars that could break Supabase Realtime topic routing
    const safeChannelId = channelId
      ? channelId.replace(/[^a-zA-Z0-9_-]/g, '_')
      : '';
    const name = `${tableName}-${restaurantId ?? 'global'}${safeChannelId ? `-${safeChannelId}` : ''}-r${retryCount}`;

    // createBrowserClient recovers its session asynchronously via _initialize().
    // If this effect runs before onAuthStateChange fires, the Realtime WebSocket
    // connects without a token and RLS silently blocks all events.
    // Fix: explicitly set the auth token before subscribing.
    supabase.auth.getSession()
      .then(({ data: sessionData }) => sessionData.session?.access_token ?? null)
      .catch(() => null) // expected for anonymous users in public apps (no refresh token)
      .then((token) => {
      if (intentionallyClosed) return; // effect was cleaned up while awaiting
      supabase.realtime.setAuth(token);

      const channel = supabase.channel(name)
        .on("postgres_changes", { event: "*", schema: "public", table: tableName, filter: f },
          () => { performFetch(); })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.info(`[Realtime] Suscrito a ${tableName} (${name})`);
          }
          if (status === 'CHANNEL_ERROR' && retryCount < MAX_RETRIES) {
            console.error(`[Realtime] Error en ${tableName} (intento ${retryCount + 1}/${MAX_RETRIES}), reconectando…`);
            setTimeout(() => setRetryCount((c) => c + 1), Math.min(3000 * 2 ** retryCount, 30000));
          }
          if (status === 'TIMED_OUT' && retryCount < MAX_RETRIES) {
            console.warn(`[Realtime] Timeout en ${tableName} (intento ${retryCount + 1}/${MAX_RETRIES}), reconectando…`);
            setTimeout(() => setRetryCount((c) => c + 1), Math.min(2000 * 2 ** retryCount, 30000));
          }
          if (status === 'CLOSED' && !intentionallyClosed && retryCount < MAX_RETRIES) {
            console.warn(`[Realtime] Cierre inesperado en ${tableName} (intento ${retryCount + 1}/${MAX_RETRIES}), reconectando…`);
            setTimeout(() => setRetryCount((c) => c + 1), 2000);
          }
        });

      // Store channel ref so cleanup can remove it
      channelRef.current = channel;
    });

    // channelRef allows the async-created channel to be removed in cleanup
    const channelRef = { current: null as ReturnType<typeof supabase.channel> | null };

    return () => {
      intentionallyClosed = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [restaurantId, performFetch, tableName, channelId, filter, retryCount]);

  return { data, loading, setData, refetch: performFetch };
}
