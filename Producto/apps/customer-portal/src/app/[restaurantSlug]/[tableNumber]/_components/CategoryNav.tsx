"use client";

import { Category } from "@menu-bites/auth";

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string | null;
  onSelectCategory: (id: string) => void;
}

export function CategoryNav({ categories, activeCategory, onSelectCategory }: CategoryNavProps) {
  return (
    <nav className="mt-4 px-6 overflow-x-auto no-scrollbar flex gap-3 pb-2 sticky top-[72px] z-40 bg-navy-dark/80 backdrop-blur-sm">
      {categories.map((cat) => (
        <button 
          key={cat.id} 
          onClick={() => onSelectCategory(cat.id)} 
          className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
            activeCategory === cat.id 
              ? 'bg-sage text-navy-dark shadow-lg shadow-sage/20 scale-105' 
              : 'bg-navy-light/40 text-sand/60 border border-sand/5 hover:bg-navy-light/60'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </nav>
  );
}
