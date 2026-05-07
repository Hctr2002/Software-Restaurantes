"use client";

import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { getPublicImageUrl } from "@menu-bites/auth";

export interface PortalMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
}

interface Props {
  item: PortalMenuItem;
  cartQuantity: number;
  onAdd: (item: PortalMenuItem) => void;
  onDecrement: (itemId: string) => void;
}

export function PortalMenuItemCard({ item, cartQuantity, onAdd, onDecrement }: Props) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      className="glass-card rounded-2xl overflow-hidden flex h-40 group border border-white/5 hover:border-sage/20 transition-colors duration-300"
    >
      {/* Imagen */}
      <div className="w-2/5 relative overflow-hidden bg-navy-light/20 shrink-0">
        <img
          src={getPublicImageUrl(item.imageUrl)}
          width={400}
          height={300}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          alt={item.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-navy-dark/30" />
      </div>

      {/* Contenido */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          <h4 className="font-bold text-sand leading-tight line-clamp-1 text-[15px]">{item.name}</h4>
          <p className="text-[11px] text-sand/50 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-sage font-black text-base">${item.price.toLocaleString()}</span>

          {cartQuantity > 0 ? (
            <div className="flex items-center gap-2 bg-sage/10 border border-sage/30 rounded-full px-2 py-1">
              <button
                onClick={() => onDecrement(item.id)}
                className="w-5 h-5 flex items-center justify-center text-sage hover:text-accent transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sand font-black text-sm w-4 text-center">{cartQuantity}</span>
              <button
                onClick={() => onAdd(item)}
                className="w-5 h-5 flex items-center justify-center text-sage hover:text-accent transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAdd(item)}
              aria-label={`Añadir ${item.name} al pedido`}
              className="flex items-center gap-1.5 bg-sage/10 hover:bg-sage text-sand hover:text-navy-dark px-3 py-1.5 rounded-full border border-sage/30 transition-all duration-200 text-xs font-bold active:scale-90"
            >
              <Plus className="w-3 h-3" />
              Añadir
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
