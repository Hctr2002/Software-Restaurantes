"use client";

import { useEffect, useRef } from "react";
import { useNotificationSound } from "@menu-bites/ui";
import { getTicketUrgency } from "../lib/kdsSettings";

const CRITICAL_SFX = "https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3";

function playSound(url: string) {
  new Audio(url).play().catch(() => {});
}

interface UseMonitorNotificationsProps {
  ordersCount: number;
  orders: any[];
  settings: {
    sounds: {
      newTicket: boolean;
      criticalAlert: boolean;
    };
    thresholds: any;
  };
  tick: number;
}

/**
 * useMonitorNotifications: Hook para gestionar las alertas sonoras y visuales
 * de los monitores de barra y cocina.
 */
export function useMonitorNotifications({ ordersCount, orders, settings, tick }: UseMonitorNotificationsProps) {
  const criticalAlerted = useRef<Set<string>>(new Set());

  // Notificación de nuevo pedido
  useNotificationSound({ count: ordersCount, enabled: settings.sounds.newTicket });

  // Alerta de pedido crítico
  useEffect(() => {
    if (!settings.sounds.criticalAlert) return;
    
    orders.forEach((order) => {
      if (["VALIDATED", "READY", "DELIVERED"].includes(order.status)) return;
      
      const urgency = getTicketUrgency(order.createdAt, settings.thresholds);
      if (urgency === "red" && !criticalAlerted.current.has(order.id)) {
        criticalAlerted.current.add(order.id);
        playSound(CRITICAL_SFX);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ordersCount, settings.sounds.criticalAlert, settings.thresholds, orders]);
}
