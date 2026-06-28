"use client";

/**
 * usePortalTableOrders — pedidos activos de la mesa para el portal del cliente.
 *
 * El cliente es anónimo, por lo que NO puede leer la tabla `orders` directamente
 * con la anon key (las políticas RLS exigen restaurant_id del JWT). Por eso este
 * hook lee a través de `/api/orders` (que usa la Service Role Key en el servidor)
 * en vez del hook `useTableOrders` de @menu-bites/auth (pensado para staff autenticado).
 *
 * Como Realtime también respeta RLS para anon, se refresca por polling.
 */

import { useCallback, useEffect, useState } from "react";
import { mapOrder, type Order } from "@menu-bites/auth";

export function usePortalTableOrders(tableId: string | undefined, pollMs = 8000) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!tableId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/orders?table_id=${encodeURIComponent(tableId)}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setOrders(Array.isArray(data) ? data.map(mapOrder) : []);
    } catch {
      // Silencioso: se reintenta en el próximo ciclo de polling.
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    refetch();
    if (!tableId) return;
    const id = setInterval(refetch, pollMs);
    return () => clearInterval(id);
  }, [tableId, refetch, pollMs]);

  return { orders, loading, refetch };
}
