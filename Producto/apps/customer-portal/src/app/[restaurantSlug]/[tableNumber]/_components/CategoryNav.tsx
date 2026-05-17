"use client";

import { Category } from "@menu-bites/auth";
import { motion } from "framer-motion";
import { PortalText, PortalPrimaryButton } from "@menu-bites/ui";

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

/**
 * Navegación por categorías del menú.
 * // Función para heredar el tema dinámico en la navegación de categorías.
 */
export function CategoryNav({ categories, activeCategory, onSelectCategory }: CategoryNavProps) {
  return (
    <nav className="px-6 overflow-x-auto no-scrollbar flex gap-2 pb-1 bg-card border-t border-border">
      {/* // Función para mostrar todos los platos de la carta completa */}
      <PortalPrimaryButton 
        variant="flat"
        onClick={() => onSelectCategory(null)}
        className="relative whitespace-nowrap px-4 py-4 text-sm font-bold transition-all duration-500 group h-auto"
      >
        {/* Usamos PortalText para asegurar herencia de fuente, pero sobreescribimos con var(--font-accent) */}
        <PortalText 
          as="span"
          font="accent"
          className={`relative z-10 transition-colors duration-300 text-[10px] font-black uppercase tracking-widest ${
            activeCategory === null ? 'text-primary' : 'text-foreground/40 group-hover:text-foreground'
          }`}
        >
          Carta Completa
        </PortalText>
        {activeCategory === null && (
          <>
            {/* // Función para animar el fondo del indicador de categoría activa */}
            <motion.div 
              layoutId="activeCategory"
              className="absolute inset-x-2 inset-y-2 bg-primary/10 rounded-xl"
              initial={false}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
            {/* // Función para animar la barra inferior del indicador de categoría activa */}
            <motion.div 
              layoutId="activeCategoryBar"
              className="absolute bottom-0 left-4 right-4 h-1 bg-primary rounded-t-full shadow-[0_-4px_12px_hsl(var(--primary)/0.5)]"
              initial={false}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          </>
        )}
      </PortalPrimaryButton>

      {/* // Función para renderizar dinámicamente cada categoría del menú */}
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <PortalPrimaryButton 
            key={cat.id} 
            variant="flat"
            onClick={() => onSelectCategory(cat.id)} 
            className="relative whitespace-nowrap px-4 py-4 text-sm font-bold transition-all duration-500 group h-auto"
          >
            <PortalText 
              as="span"
              font="accent"
              className={`relative z-10 transition-colors duration-300 text-[10px] font-black uppercase tracking-widest ${
                isActive ? 'text-primary' : 'text-foreground/40 group-hover:text-foreground'
              }`}
                >
              {cat.name}
            </PortalText>
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
          </PortalPrimaryButton>
        );
      })}
    </nav>
  );
}
