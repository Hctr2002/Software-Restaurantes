/**
 * OrderToolbar — Barra de filtros y refresco de la página de pedidos.
 * Permite filtrar por estado (SELECT) y forzar recarga manual de la lista.
 */
import React from "react";
import { Button } from "@menu-bites/ui";
import { RefreshCw } from "lucide-react";
import { ORDER_STATUSES } from "../../_components/localShared";

interface OrderToolbarProps {
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  onRefresh: () => void;
}

export function OrderToolbar({ filterStatus, setFilterStatus, onRefresh }: OrderToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="h-11 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer sm:w-64"
      >
        <option value="ALL" className="bg-background">Todos los estados</option>
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s} className="bg-background">{s}</option>
        ))}
      </select>

      <Button
        variant="ghost"
        onClick={onRefresh}
        className="h-11 px-6 rounded-2xl bg-foreground/5 border border-foreground/5 hover:bg-primary/10 hover:text-primary transition-all group font-bold uppercase tracking-widest text-[10px]"
      >
        <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
        Actualizar Lista
      </Button>
    </div>
  );
}
