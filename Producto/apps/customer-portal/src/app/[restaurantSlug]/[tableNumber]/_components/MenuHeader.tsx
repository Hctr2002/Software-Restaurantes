"use client";

import { ShoppingBag, MapPin, Search } from "lucide-react";
import { TableRecord } from "@menu-bites/auth";

interface MenuHeaderProps {
  restaurantName: string;
  tableData: TableRecord | null;
  cartCount: number;
  onOpenCheckout: () => void;
}

export function MenuHeader({ restaurantName, tableData, cartCount, onOpenCheckout }: MenuHeaderProps) {
  return (
    <header className="sticky top-0 z-50 glass-panel px-6 py-4 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-sand">{restaurantName}</h1>
        <p className="text-xs text-sage font-medium uppercase tracking-widest flex items-center gap-1">
          <MapPin className="w-3 h-3" aria-hidden="true" />
          {tableData ? `Mesa ${tableData.number}` : 'Indica tu mesa al confirmar'}
        </p>
      </div>
      <div className="flex gap-4">
        <button aria-label="Buscar platos" className="p-2 rounded-full hover:bg-sand/10 transition-colors">
          <Search className="w-5 h-5 text-sand/80" aria-hidden="true" />
        </button>
        <div className="relative">
          <button onClick={onOpenCheckout} className="p-2 rounded-full bg-sage/20 text-sage hover:bg-sage/30 transition-all">
            <ShoppingBag className="w-5 h-5" aria-hidden="true" />
          </button>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent text-navy-dark text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-in zoom-in">
              {cartCount}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
