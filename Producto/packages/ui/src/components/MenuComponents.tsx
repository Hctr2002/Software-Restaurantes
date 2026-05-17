"use client";

import React from "react";
import { cn } from "../lib/utils";
import { Plus, Search, X } from "lucide-react";

interface MenuItemCardProps {
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  onAdd?: () => void;
}

export const MenuItemCard = ({ name, price, imageUrl, description, onAdd }: MenuItemCardProps) => {
  return (
    <div className="group relative flex flex-col bg-card border border-border rounded-2xl overflow-hidden transition-all hover:bg-muted/30">
      {imageUrl && (
        <div className="h-32 w-full overflow-hidden">
          <img src={imageUrl} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-white leading-tight">{name}</h3>
          <span className="text-primary font-black text-sm">${price.toLocaleString()}</span>
        </div>
        {description && <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>}
        <button 
          onClick={onAdd}
          className="w-full mt-2 flex items-center justify-center py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg transition-all"
        >
          <Plus className="w-3 h-3 mr-1" /> Añadir
        </button>
      </div>
    </div>
  );
};

export const ProductSearchBar = ({ value, onChange, onClear }: { value: string, onChange: (v: string) => void, onClear: () => void }) => {
  return (
    <div className="relative group px-4">
      <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <input
        type="text"
        placeholder="Buscar plato, bebida..."
        className="w-full bg-muted/30 border border-border rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button onClick={onClear} className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
