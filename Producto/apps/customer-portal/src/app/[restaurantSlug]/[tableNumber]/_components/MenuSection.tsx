"use client";

import { motion } from "framer-motion";
import { PortalMenuItemCard } from "@menu-bites/ui";
import { MenuItem, Category } from "@menu-bites/auth";

interface MenuSectionProps {
  categoryName: string;
  activeCategory: string | null;
  categories: Category[];
  items: MenuItem[];
  cart: any[];
  onAdd: (item: MenuItem) => void;
  onDecrement: (id: string) => void;
}

export function MenuSection({ categoryName, activeCategory, categories, items, cart, onAdd, onDecrement }: MenuSectionProps) {
  // Vista "Todo": Muestra todas las categorías con sus productos
  if (activeCategory === null) {
    return (
      <div className="space-y-4">
        {categories.map((cat) => {
          const categoryItems = items.filter(item => item.categoryId === cat.id);
          if (categoryItems.length === 0) return null;

          return (
            <section key={cat.id} className="px-6 pt-10 space-y-6 first:pt-4">
              <h3 
                className="text-lg font-black text-primary border-l-4 border-primary pl-4 uppercase tracking-[0.2em] italic"
                style={{ fontFamily: "var(--font-title)" }}
              >
                {cat.name}
              </h3>
              <motion.div 
                initial="hidden" 
                animate="show" 
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }} 
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8"
              >
                {categoryItems.map((item) => (
                  <PortalMenuItemCard 
                    key={item.id} 
                    item={item} 
                    cartQuantity={cart.find((c: any) => c.id === item.id)?.quantity ?? 0} 
                    onAdd={onAdd} 
                    onDecrement={onDecrement} 
                  />
                ))}
              </motion.div>
            </section>
          );
        })}
      </div>
    );
  }

  // Vista de Categoría Individual
  return (
    <section className="px-6 mt-10 space-y-6">
      <h3 
        className="text-lg font-black text-primary border-l-4 border-primary pl-4 uppercase tracking-[0.2em] italic"
        style={{ fontFamily: "var(--font-title)" }}
      >
        {categoryName}
      </h3>
      <motion.div 
        key={activeCategory} 
        initial="hidden" 
        animate="show" 
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }} 
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8"
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
          <div className="text-center py-12 col-span-full">
            <p className="text-sand/40 italic">No hay platos disponibles en esta categoría.</p>
          </div>
        )}
      </motion.div>
    </section>
  );
}
