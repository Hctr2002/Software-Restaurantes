"use client";

import React from "react";
import { Badge } from "@menu-bites/ui";
import { PowerOff, Package, ClipboardList, Loader2, CheckCircle } from "lucide-react";
import { Alert, AlertType, timeAgo } from "./localShared";

const TYPE_CONFIG: Record<AlertType, { label: string; variant: "danger" | "warning" | "info" | "neutral" }> = {
  TABLE_ISSUE:    { label: "Problema en Mesa",  variant: "danger"  },
  BILL_REQUEST:   { label: "Pedir Cuenta",       variant: "warning" },
  STOCK_SHORTAGE: { label: "Quiebre de Stock",   variant: "danger"  },
  HELP_REQUEST:   { label: "Ayuda Requerida",    variant: "info"    },
  GENERAL:        { label: "Mensaje",            variant: "neutral" },
};

interface AlertItemProps {
  alert: Alert;
  isActing: boolean;
  onResolve: (id: string, action?: "disable_item", menuItemId?: string | null) => void;
  onNavigate: (path: string) => void;
  basePath: string;
}

function senderLabel(alert: Alert) {
  if (!alert.user_email) return "Sistema";
  return alert.user_email.split("@")[0];
}

export default function AlertItem({ 
  alert, 
  isActing, 
  onResolve, 
  onNavigate, 
  basePath 
}: AlertItemProps) {
  const cfg = TYPE_CONFIG[alert.type] || { label: "Alerta", variant: "neutral" };

  return (
    <div className="p-6 rounded-[2rem] border border-primary/10 bg-white/[0.04] backdrop-blur-md space-y-4 group hover:border-primary/50 hover:bg-white/[0.08] transition-all shadow-xl">
      {/* Header de la alerta */}
      <div className="flex items-start justify-between gap-4">
        <Badge variant={cfg.variant} className="px-3 py-1 text-[9px] font-black uppercase tracking-widest shadow-sm">
          {cfg.label}
        </Badge>
        <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest shrink-0">
          {timeAgo(alert.created_at)}
        </span>
      </div>

      {/* Mensaje */}
      <div>
        <p className="text-sm font-bold text-foreground uppercase italic tracking-tight leading-tight">{alert.message}</p>
        <div className="flex items-center gap-2 mt-2 text-[10px] font-black text-foreground/50 uppercase tracking-widest">
          <span className="text-primary font-black drop-shadow-sm">{senderLabel(alert)}</span>
          {alert.table_number && (
            <>
              <span className="opacity-20">•</span>
              <span>Mesa {alert.table_number}</span>
            </>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-2 pt-2">
        {alert.type === "STOCK_SHORTAGE" && alert.menu_item_id && (
          <button
            disabled={isActing}
            onClick={() => onResolve(alert.id, "disable_item", alert.menu_item_id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
          >
            <PowerOff className="w-3.5 h-3.5" /> Deshabilitar
          </button>
        )}

        {alert.type === "STOCK_SHORTAGE" && (
          <button
            onClick={() => onNavigate(`${basePath}/inventory`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all"
          >
            <Package className="w-3.5 h-3.5" /> Inventario
          </button>
        )}

        {(alert.type === "TABLE_ISSUE" || alert.type === "BILL_REQUEST") && (
          <button
            onClick={() => onNavigate(`${basePath}/orders`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all"
          >
            <ClipboardList className="w-3.5 h-3.5" /> Pedidos
          </button>
        )}

        <button
          disabled={isActing}
          onClick={() => onResolve(alert.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:bg-primary/80 transition-all disabled:opacity-50 ml-auto shadow-lg shadow-primary/20"
        >
          {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          Resolver
        </button>
      </div>
    </div>
  );
}
