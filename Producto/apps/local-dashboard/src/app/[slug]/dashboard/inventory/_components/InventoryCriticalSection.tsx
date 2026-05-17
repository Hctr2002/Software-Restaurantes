/**
 * InventoryCriticalSection — Sección de alertas visuales de stock agotado y bajo.
 * Se renderiza solo si existen ítems críticos; no muestra nada cuando todo está OK.
 */
"use client";

import { AlertTriangle, Package } from "lucide-react";
import { Inventory } from "@menu-bites/auth";
import { LOW_STOCK_THRESHOLD } from "@menu-bites/auth";

interface InventoryCriticalSectionProps {
  items: Inventory[];
}

export default function InventoryCriticalSection({ items }: InventoryCriticalSectionProps) {
  const criticalItems = items.filter((i) => i.stock <= 0);
  const lowItems      = items.filter((i) => i.stock > 0 && i.stock <= LOW_STOCK_THRESHOLD);

  if (criticalItems.length === 0 && lowItems.length === 0) return null;

  return (
    <div className="mb-8 space-y-3">
      {criticalItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-red-400 uppercase tracking-widest">
            <AlertTriangle className="w-3.5 h-3.5" />
            Agotados — {criticalItems.length} ítem(s)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {criticalItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-red-300 text-sm font-bold truncate">{item.name}</span>
                </div>
                <span className="text-red-400 text-xs font-black ml-2 tabular-nums shrink-0">0 {item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {lowItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-yellow-400 uppercase tracking-widest">
            <AlertTriangle className="w-3.5 h-3.5" />
            Stock Bajo — {lowItems.length} ítem(s) (≤ {LOW_STOCK_THRESHOLD})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span className="text-yellow-300 text-sm font-bold truncate">{item.name}</span>
                </div>
                <span className="text-yellow-400 text-xs font-black ml-2 tabular-nums shrink-0">
                  {Number(item.stock).toFixed(2)} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
