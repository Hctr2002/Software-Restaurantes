"use client";

import { motion } from "framer-motion";
import { PortalMenuItemCard, PortalHeading, PortalText } from "@menu-bites/ui";
import { MenuItem, Category } from "@menu-bites/auth";

/**
 * Propiedades del componente MenuSection.
 */
interface MenuSectionProps {
  categoryName: string;
  activeCategory: string | null;
  categories: Category[];
  items: MenuItem[];
  cart: any[];
  onAdd: (item: MenuItem) => void;
  onDecrement: (id: string) => void;
}

/**
 * Componente que renderiza las secciones del menú agrupadas por categoría.
 * // Función para heredar el listado del menú y sincronizar encabezados con el tema dinámico.
 */
export function MenuSection({ categoryName, activeCategory, categories, items, cart, onAdd, onDecrement }: MenuSectionProps) {
  // Vista "Todo": Muestra todas las categorías con sus productos secuencialmente
  if (activeCategory === null) {
    return (
      <div className="space-y-4">
        {/* // Función para iterar sobre todas las categorías disponibles */}
        {categories.map((cat) => {
          // Filtrar items que pertenecen a esta categoría específica
          const categoryItems = items.filter(item => item.categoryId === cat.id);
          if (categoryItems.length === 0) return null;

          return (
            <section key={cat.id} className="px-6 pt-10 space-y-6 first:pt-4">
              {/* // Función para renderizar el encabezado de categoría con estilo premium */}
              <PortalHeading 
                as="h3"
                font="accent"
                className="text-lg font-black text-primary border-l-4 border-primary pl-4 uppercase tracking-[0.2em] italic"
              >
                {cat.name}
              </PortalHeading>
              
              {/* // Función para renderizar el grid de platos con animación de entrada escalonada */}
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

  // Vista de Categoría Individual (cuando hay un filtro activo)
  return (
    <section className="px-6 mt-10 space-y-6">
      {/* // Función para mostrar el nombre de la categoría filtrada actualmente */}
      <PortalHeading 
        as="h3"
        font="accent"
        className="text-lg font-black text-primary border-l-4 border-primary pl-4 uppercase tracking-[0.2em] italic"
      >
        {categoryName}
      </PortalHeading>

      {/* // Función para listar los platos filtrados con efectos de transición */}
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
          /* // Función para mostrar un estado vacío amigable si no hay resultados */
          <div className="text-center py-12 col-span-full">
            <PortalText className="text-foreground/40 italic">No hay platos disponibles en esta categoría.</PortalText>
          </div>
        )}
      </motion.div>
    </section>
  );
}
