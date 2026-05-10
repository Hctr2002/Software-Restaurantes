"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { getPublicImageUrl, MenuItem } from "@menu-bites/auth";

export type PortalMenuItem = MenuItem;

interface Props {
  item: PortalMenuItem;
  cartQuantity: number;
  onAdd: (item: PortalMenuItem) => void;
  onDecrement: (itemId: string) => void;
}

export function PortalMenuItemCard({ item, cartQuantity, onAdd, onDecrement }: Props) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      className="glass-premium rounded-[2.5rem] sm:rounded-[3.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col group transition-all duration-700 hover:shadow-primary/20 hover:-translate-y-2"
    >
      {/* Imagen Pro con Badge Dinámico */}
      <div className="h-44 sm:h-56 w-full relative overflow-hidden bg-navy-light/10">
        <motion.img
          src={getPublicImageUrl(item.imageUrl)}
          className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
          alt={item.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {/* Badge de Cantidad Glassmorphism */}
        <AnimatePresence>
          {cartQuantity > 0 && (
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              className="absolute top-4 right-4 px-4 py-2 rounded-2xl border border-white/20 backdrop-blur-xl bg-primary shadow-2xl z-20"
            >
              <span 
                className="text-[10px] font-black text-primary-foreground uppercase tracking-widest flex items-center gap-2"
                style={{ fontFamily: "var(--font-accent)" }}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {cartQuantity} en Mesa
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Contenido Pro - Estilo Branding Lab */}
      <div className="p-6 sm:p-8 flex flex-col space-y-4 bg-gradient-to-br from-white/[0.03] to-transparent">
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-4">
            <h4 
              className="font-black text-foreground leading-none text-xl sm:text-2xl tracking-tighter italic uppercase group-hover:text-primary transition-colors duration-500 line-clamp-1"
              style={{ fontFamily: "var(--font-title)" }}
            >
              {item.name}
            </h4>
            <div className="flex flex-col items-end shrink-0">
              <span 
                className="text-primary font-black text-xl sm:text-2xl italic tracking-tighter leading-none"
                style={{ fontFamily: "var(--font-accent)" }}
              >
                ${item.price.toLocaleString()}
              </span>
            </div>
          </div>
          <p 
            className="text-[11px] sm:text-xs font-bold text-foreground/40 leading-relaxed line-clamp-2 min-h-[2.5rem]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {item.description}
          </p>
        </div>

        {/* Acciones de Control Pro */}
        <div className="pt-2">
          <AnimatePresence mode="wait">
            {cartQuantity > 0 ? (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-[1.5rem] p-1.5 backdrop-blur-md w-full justify-between shadow-inner"
              >
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDecrement(item.id)}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 text-foreground hover:bg-white/10 hover:text-primary rounded-xl transition-all"
                >
                  <Minus className="w-4 h-4" />
                </motion.button>
                
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">Cantidad</span>
                  <span className="text-foreground font-black text-base">{cartQuantity}</span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onAdd(item)}
                  className="w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all shadow-lg shadow-primary/20"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAdd(item)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-2xl shadow-xl shadow-primary/25 transition-all duration-500 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 group/btn relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                <Plus className="w-4 h-4" />
                Añadir al Carrito
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
