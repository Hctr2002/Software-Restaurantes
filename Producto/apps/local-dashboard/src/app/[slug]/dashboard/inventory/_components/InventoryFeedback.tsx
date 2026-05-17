/**
 * InventoryFeedback — Mensaje de resultado para la importación CSV de inventario.
 * Muestra un banner verde en éxito o rojo en error; se oculta si no hay mensaje.
 */
"use client";

import React from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { ImportStatus } from "@/hooks/useInventory";

interface InventoryFeedbackProps {
  message: string | null;
  status: ImportStatus | null;
}

export default function InventoryFeedback({ message, status }: InventoryFeedbackProps) {
  if (!message) return null;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border text-sm font-bold mb-4 ${
      status === "success"
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        : "bg-destructive/10 border-destructive/30 text-destructive"
    }`}>
      {status === "success"
        ? <CheckCircle className="w-4 h-4 shrink-0" />
        : <AlertTriangle className="w-4 h-4 shrink-0" />}
      {message}
    </div>
  );
}
