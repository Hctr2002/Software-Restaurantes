"use client";

/**
 * PortalMenuItemCard — Tarjeta de ítem del menú para el portal del cliente.
 * Hereda tipografías y colores del tema dinámico del restaurante.
 * Muestra imagen, nombre, descripción, precio y controles de cantidad +/−.
 * Las animaciones de entrada se controlan por el contenedor padre (variants hidden/show).
 */

import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { getPublicImageUrl, MenuItem } from "@menu-bites/auth";
import { PortalHeading } from "./primitives/PortalHeading";
import { PortalText } from "./primitives/PortalText";
import { PortalPrimaryButton } from "./primitives/PortalPrimaryButton";

export type PortalMenuItem = MenuItem;

interface Props {
  item: PortalMenuItem;
  cartQuantity: number;
  onAdd: (item: PortalMenuItem) => void;
  onDecrement: (itemId: string) => void;
}

/**
 * Tarjeta de producto del menú del portal.
 * // Función para heredar el tema dinámico en la visualización de platos y sincronizar estilos.
 */
export function PortalMenuItemCard({ item, cartQuantity, onAdd, onDecrement }: Props) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      className="bg-card rounded-[2.5rem] sm:rounded-[3.5rem] border border-foreground/5 overflow-hidden shadow-xl flex flex-col group transition-all duration-700 hover:shadow-primary/20 hover:-translate-y-2"
    >
      {/* Imagen Pro con Badge Dinámico */}
      <div className="h-44 sm:h-56 w-full relative overflow-hidden bg-foreground/[0.05]">
        <motion.img
          src={getPublicImageUrl(item.imageUrl)}
          className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
          alt={item.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {/* // Función para mostrar el indicador de cantidad con fuente de acento heredada */}
        <AnimatePresence>
          {cartQuantity > 0 && (
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              className="absolute top-4 right-4 px-4 py-2 rounded-2xl border border-white/10 bg-primary shadow-xl z-20"
            >
              {/* // Función para mostrar el indicador de cantidad con fuente de acento heredada */}
              <PortalText 
                as="span"
                font="accent"
                className="text-[10px] font-black text-primary-foreground uppercase tracking-widest flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {cartQuantity}
              </PortalText>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Contenido Pro - Estilo Branding Lab */}
      <div className="p-6 sm:p-8 flex flex-col space-y-4 bg-gradient-to-br from-foreground/[0.02] to-transparent">
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-4">
            {/* // Función para renderizar el nombre del plato con la fuente de encabezado del tema */}
            <div className="flex-1 min-w-0">
              <PortalHeading
                as="h4"
                className="text-base sm:text-lg font-black text-foreground tracking-tighter italic uppercase group-hover:text-primary transition-colors duration-500 [overflow:clip] [overflow-clip-margin:16px] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
              >
                {item.name}
              </PortalHeading>
            </div>
            <div className="flex flex-col items-end shrink-0">
              {/* // Función para renderizar el precio con la fuente de acento heredada */}
              <PortalText 
                as="span"
                font="accent"
                className="text-primary font-black text-base sm:text-xl italic tracking-tighter leading-none"
              >
                ${item.price.toLocaleString()}
              </PortalText>
            </div>
          </div>
          {/* // Función para mostrar la descripción del plato con la fuente del cuerpo */}
          <PortalText 
            className="text-[11px] sm:text-xs font-bold text-foreground/40 leading-relaxed line-clamp-2 min-h-[2.5rem]"
          >
            {item.description}
          </PortalText>
        </div>

        {/* Acciones de Control Pro */}
        <div className="pt-2">
          <AnimatePresence mode="wait">
            {cartQuantity > 0 ? (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="flex items-center gap-2 bg-foreground/[0.03] border border-foreground/5 rounded-[1.5rem] p-1.5 w-full justify-between shadow-inner"
              >
                {/* // Función para disminuir la cantidad del item en el carrito */}
                <PortalPrimaryButton
                  variant="ghost"
                  size="icon"
                  onClick={() => onDecrement(item.id)}
                  aria-label="Disminuir cantidad"
                  className="bg-foreground/5 hover:bg-foreground/10 hover:text-primary rounded-xl"
                >
                  <Minus className="w-4 h-4" />
                </PortalPrimaryButton>
                
                <div className="flex flex-col items-center">
                  {/* // Función para mostrar la etiqueta de cantidad con fuente de acento heredada */}
                  <PortalText 
                    as="span"
                    font="accent"
                    className="text-[8px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1"
                  >
                    Cantidad
                  </PortalText>
                  <PortalText as="span" className="text-foreground font-black text-base">{cartQuantity}</PortalText>
                </div>

                {/* // Función para aumentar la cantidad del item en el carrito */}
                <PortalPrimaryButton
                  variant="primary"
                  size="icon"
                  onClick={() => onAdd(item)}
                  aria-label="Aumentar cantidad"
                  className="rounded-xl shadow-lg shadow-primary/20"
                >
                  <Plus className="w-4 h-4" />
                </PortalPrimaryButton>
              </motion.div>
            ) : (
              <PortalPrimaryButton
                onClick={() => onAdd(item)}
                font="accent"
                className="w-full py-4 text-[10px] uppercase tracking-[0.2em] relative overflow-hidden group/btn"
              >
                {/* // Función para aplicar el efecto de brillo animado en el botón de añadir */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                <Plus className="w-4 h-4" />
                Añadir al Carrito
              </PortalPrimaryButton>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
