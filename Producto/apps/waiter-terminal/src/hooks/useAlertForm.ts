"use client";

import { useState } from "react";
import { sendAlert } from "@menu-bites/auth";
import type { AlertType } from "@menu-bites/auth";

export function useAlertForm(
  restaurantId: string | undefined,
  userId: string | undefined,
  userEmail: string | undefined
) {
  const [alertType, setAlertType] = useState<AlertType>("HELP_REQUEST");
  const [alertMsg, setAlertMsg] = useState("");
  const [tableNum, setTableNum] = useState("");
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  const handleSendAlert = async (): Promise<boolean> => {
    if (!alertMsg.trim() || !restaurantId) return false;
    setSendingAlert(true);
    const { error } = await sendAlert({
      restaurantId,
      userId: userId ?? "",
      userEmail: userEmail ?? "",
      type: alertType,
      message: alertMsg.trim(),
      tableNumber: tableNum ? parseInt(tableNum) : undefined,
    });
    setSendingAlert(false);
    if (!error) {
      setAlertSent(true);
      setTimeout(() => {
        setAlertSent(false);
        setAlertMsg("");
        setTableNum("");
        setAlertType("HELP_REQUEST");
      }, 1500);
    }
    return !error;
  };

  const reset = () => {
    setAlertMsg("");
    setTableNum("");
    setAlertType("HELP_REQUEST");
    setAlertSent(false);
  };

  return {
    alertType, setAlertType,
    alertMsg, setAlertMsg,
    tableNum, setTableNum,
    sendingAlert,
    alertSent,
    handleSendAlert,
    reset,
  };
}
