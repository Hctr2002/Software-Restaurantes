"use client";

import { useEffect, useRef } from "react";
import type { Order } from "@menu-bites/auth";
import { useNotificationSound } from "@menu-bites/ui";

export function useWebPush(restaurantId: string | undefined, readyOrders: Order[], pendingOrders: Order[] = []) {
  const prevCount = useRef(0);
  const { audioBlocked, enableAudio } = useNotificationSound({ count: readyOrders.length + pendingOrders.length });

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
          body: JSON.stringify({ restaurantId, tableNumber: order.table?.number }),
        }).catch(() => {});
      });
    }
    prevCount.current = readyOrders.length;
  }, [readyOrders.length, restaurantId]);

  return { audioBlocked, enableAudio };
}
