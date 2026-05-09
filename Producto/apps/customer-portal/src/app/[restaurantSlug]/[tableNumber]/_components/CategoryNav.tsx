"use client";

import { Category } from "@menu-bites/auth";
import { motion } from "framer-motion";

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string | null;
  onSelectCategory: (id: string) => void;
}

export function CategoryNav({ categories, activeCategory, onSelectCategory }: CategoryNavProps) {
  return (
    <nav className="mt-2 px-6 overflow-x-auto no-scrollbar flex gap-2 pb-3 sticky top-[96px] z-40 bg-background border-b border-white/5 shadow-2xl">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button 
            key={cat.id} 
            onClick={() => onSelectCategory(cat.id)} 
            className="relative whitespace-nowrap px-4 py-3 text-sm font-bold transition-all duration-500 group"
          >
            <span 
              className={`relative z-10 transition-colors duration-300 text-xs font-black uppercase tracking-widest ${
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              }`}
              style={{ fontFamily: "var(--font-accent)" }}
            >
              {cat.name}
            </span>
            {isActive && (
              <motion.div 
                layoutId="activeCategory"
                className="absolute inset-0 bg-primary/10 rounded-xl"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {isActive && (
              <motion.div 
                layoutId="activeCategoryBar"
                className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_12px_rgba(var(--primary),0.5)]"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
