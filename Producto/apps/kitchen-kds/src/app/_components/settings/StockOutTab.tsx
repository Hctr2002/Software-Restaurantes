"use client";

import { cn } from "@menu-bites/ui";

interface MenuItem { id: string; name: string; is_active: boolean; }

interface Props {
  menuItems: MenuItem[];
  loadingMenu: boolean;
  restaurantId: string | undefined;
  onToggle: (item: MenuItem) => void;
}

export function StockOutTab({ menuItems, loadingMenu, restaurantId, onToggle }: Props) {
  if (loadingMenu) return <div className="flex justify-center py-12 text-white/30 text-sm">Cargando menú...</div>;
  if (!restaurantId) return <div className="flex justify-center py-12 text-white/30 text-sm">Sin conexión — modo demo activo</div>;
  if (menuItems.length === 0) return <div className="flex justify-center py-12 text-white/30 text-sm">No hay items en el menú</div>;

  return (
    <div className="space-y-4">
      <p className="text-white/40 text-sm">Marca productos como agotados. El cambio es inmediato en el sistema.</p>
      {menuItems.map((item) => (
        <div key={item.id} className={cn("flex items-center justify-between px-5 py-4 rounded-2xl border transition-all", item.is_active ? "bg-white/5 border-white/5" : "bg-red-500/10 border-red-500/20")}>
          <div>
            <p className={cn("font-semibold text-sm", item.is_active ? "text-white" : "text-red-400 line-through")}>{item.name}</p>
            {!item.is_active && <p className="text-red-400/60 text-xs font-bold uppercase tracking-widest mt-0.5">86 — Agotado</p>}
          </div>
          <button onClick={() => onToggle(item)} className={cn("px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all", item.is_active ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30")}>
            {item.is_active ? "86 Item" : "Restaurar"}
          </button>
        </div>
      ))}
    </div>
  );
}
