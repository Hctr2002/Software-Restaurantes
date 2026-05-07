"use client";

import { useEffect, useRef } from "react";
import type { PendingOrder } from "../app/_components/PendingOrderCard";

export function useWebPush(restaurantId: string | undefined, readyOrders: PendingOrder[]) {
  const prevCount = useRef(0);

  useEffect(() => {
    if (!restaurantId || typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey });
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
      } catch {
        // Push no disponible — degradar silenciosamente
      }
    })();
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    if (readyOrders.length > prevCount.current) {
      readyOrders.slice(prevCount.current).forEach((order) => {
        fetch("/api/push/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurantId, tableNumber: order.tables?.number }),
        }).catch(() => {});
      });
    }
    prevCount.current = readyOrders.length;
  }, [readyOrders.length, restaurantId]);
}
