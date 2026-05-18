"use client";

/**
 * CategoryTabs — Pestañas de navegación por categorías del menú.
 * Usado en el portal del cliente y en el KDS para filtrar ítems por categoría.
 */

import React from "react";
import { cn } from "../lib/utils";

interface Category {
  id: string;
  name: string;
}

interface CategoryTabsProps {
  categories: Category[];
  activeId?: string;
  onSelect: (id: string) => void;
}

export const CategoryTabs = ({ categories, activeId, onSelect }: CategoryTabsProps) => {
  return (
    <div className="flex space-x-2 overflow-x-auto px-4 pb-2 scrollbar-none scroll-smooth no-scrollbar">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300",
            activeId === cat.id
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
              : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
};
