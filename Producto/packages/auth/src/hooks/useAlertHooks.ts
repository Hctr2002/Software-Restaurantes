"use client";

import { useCallback, useState } from "react";
import { supabase, sendAlert } from "../index";
import type { Alert, AlertType } from "../types";
import { useRealtimeSync } from "./useRealtimeSync";

export function useRealtimeAlerts(restaurantId: string | undefined) {
  const fetchFn = useCallback(async () => {
    return supabase
      .from("alerts")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("isRead", false)
      .order("createdAt", { ascending: false });
  }, [restaurantId]);

  const { data: alerts, loading, refetch } = useRealtimeSync<Alert[]>(
    restaurantId,
    "alerts",
    fetchFn
  );

  return { alerts, loading, refetch };
}

export function useAlertForm(restaurantId: string | undefined, userId?: string, userEmail?: string) {
  const [form, setForm] = useState({
    type: "HELP" as AlertType,
    msg: "",
    table: "",
    sending: false,
    sent: false,
  });

  const handleSendAlert = async (): Promise<boolean> => {
    if (!form.msg.trim() || !restaurantId) return false;
    setForm(p => ({ ...p, sending: true }));
    const { error } = await sendAlert({
      restaurantId, userId: userId ?? "", userEmail: userEmail ?? "",
      type: form.type, message: form.msg.trim(),
      tableNumber: form.table ? parseInt(form.table) : undefined,
    });
    setForm(p => ({ ...p, sending: false, sent: !error }));
    if (!error) {
      setTimeout(() => setForm({ type: "HELP", msg: "", table: "", sending: false, sent: false }), 1500);
    }
    return !error;
  };

  const reset = () => setForm({ type: "HELP", msg: "", table: "", sending: false, sent: false });

  return {
    alertType: form.type, setAlertType: (type: AlertType) => setForm(p => ({ ...p, type })),
    alertMsg: form.msg, setAlertMsg: (msg: string) => setForm(p => ({ ...p, msg })),
    tableNum: form.table, setTableNum: (table: string) => setForm(p => ({ ...p, table })),
    sendingAlert: form.sending, alertSent: form.sent,
    handleSendAlert, reset,
  };
}
