"use client";

import { motion } from "framer-motion";
import { PortalMenuItemCard } from "@menu-bites/ui";
import { MenuItem } from "@menu-bites/auth";

interface MenuSectionProps {
  categoryName: string;
  activeCategory: string | null;
  items: MenuItem[];
  cart: any[];
  onAdd: (item: MenuItem) => void;
  onDecrement: (id: string) => void;
}

export function MenuSection({ categoryName, activeCategory, items, cart, onAdd, onDecrement }: MenuSectionProps) {
  return (
    <section className="px-6 mt-10 space-y-6">
      <h3 className="text-lg font-semibold text-sage-light border-l-4 border-sage pl-3 uppercase tracking-widest text-sm">
        {categoryName}
      </h3>
      <motion.div 
        key={activeCategory} 
        initial="hidden" 
        animate="show" 
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }} 
        className="grid grid-cols-1 gap-4"
      >
        {items.length > 0 ? (
          items.map((item) => (
            <PortalMenuItemCard 
              key={item.id} 
              item={item} 
              cartQuantity={cart.find((c: any) => c.id === item.id)?.quantity ?? 0} 
              onAdd={onAdd} 
              onDecrement={onDecrement} 
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-sand/40 italic">No hay platos disponibles en esta categoría.</p>
          </div>
        )}
      </motion.div>
    </section>
  );
}
