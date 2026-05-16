"use client";

import { Category } from "@menu-bites/auth";
import { motion } from "framer-motion";

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

export function CategoryNav({ categories, activeCategory, onSelectCategory }: CategoryNavProps) {
  return (
    <nav className="px-6 overflow-x-auto no-scrollbar flex gap-2 pb-1 bg-transparent border-t border-foreground/5">
      {/* Opción "Todo" */}
      <button 
        onClick={() => onSelectCategory(null)}
        className="relative whitespace-nowrap px-4 py-4 text-sm font-bold transition-all duration-500 group"
      >
        <span 
          className={`relative z-10 transition-colors duration-300 text-[10px] font-black uppercase tracking-widest font-accent ${
            activeCategory === null ? 'text-primary' : 'text-foreground/40 group-hover:text-foreground'
          }`}
        >
          Carta Completa
        </span>
        {activeCategory === null && (
          <>
            <motion.div 
              layoutId="activeCategory"
              className="absolute inset-x-2 inset-y-2 bg-primary/10 rounded-xl"
              initial={false}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
            <motion.div 
              layoutId="activeCategoryBar"
              className="absolute bottom-0 left-4 right-4 h-1 bg-primary rounded-t-full shadow-[0_-4px_12px_hsl(var(--primary)/0.5)]"
              initial={false}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          </>
        )}
      </button>

      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button 
            key={cat.id} 
            onClick={() => onSelectCategory(cat.id)} 
            className="relative whitespace-nowrap px-4 py-4 text-sm font-bold transition-all duration-500 group"
          >
            <span 
              className={`relative z-10 transition-colors duration-300 text-[10px] font-black uppercase tracking-widest font-accent ${
                isActive ? 'text-primary' : 'text-foreground/40 group-hover:text-foreground'
              }`}
                >
              {cat.name}
            </span>
            {isActive && (
              <>
                <motion.div 
                  layoutId="activeCategory"
                  className="absolute inset-x-2 inset-y-2 bg-primary/10 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
                <motion.div 
                  layoutId="activeCategoryBar"
                  className="absolute bottom-0 left-4 right-4 h-1 bg-primary rounded-t-full shadow-[0_-4px_12px_hsl(var(--primary)/0.5)]"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              </>
            )}
          </button>
        );
      })}
    </nav>
  );
}
