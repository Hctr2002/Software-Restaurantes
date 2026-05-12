"use client";

import { motion } from "framer-motion";
import { Badge, Button } from "@menu-bites/ui";
import { ImagePlus, Power, Pencil, Trash2, Loader2 } from "lucide-react";
import { formatPrice, MenuItem } from "@/app/[slug]/dashboard/_components/localShared";

interface MenuItemCardProps {
  item: MenuItem;
  onToggleActive: (item: MenuItem) => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function MenuItemCard({ item, onToggleActive, onEdit, onDelete, isDeleting }: MenuItemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-premium rounded-[2.5rem] border-foreground/10 overflow-hidden flex flex-col group transition-all duration-300 shadow-xl ${!item.is_active && 'opacity-60 grayscale-[0.5]'}`}
    >
      {/* Image Header */}
      <div className="relative h-48 overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full bg-foreground/5 flex items-center justify-center">
            <ImagePlus className="w-8 h-8 text-foreground/10" />
          </div>
        )}
        <div className="absolute top-4 left-4">
          <Badge variant={item.is_active ? "success" : "neutral"} className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-background/80 backdrop-blur-md border-foreground/10">
            {item.is_active ? "En Venta" : "Pausado"}
          </Badge>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => onToggleActive(item)}
            className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${item.is_active ? "bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground" : "bg-foreground/10 text-foreground hover:bg-primary hover:text-primary-foreground"}`}
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-black text-foreground text-lg tracking-tight leading-tight uppercase italic">{item.name}</h3>
            <span className="font-black text-primary text-base shrink-0">{formatPrice(item.price)}</span>
          </div>
          <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{item.categories?.name || 'General'}</p>
          {item.description && <p className="text-xs text-foreground/40 font-medium line-clamp-2 leading-relaxed">{item.description}</p>}
        </div>

        <div className="pt-6 mt-auto border-t border-foreground/5 flex gap-2">
          <Button 
            className="flex-1 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-primary/20 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest transition-all"
            onClick={() => onEdit(item)}
          >
            <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
          </Button>
          <Button 
            variant="ghost"
            className="aspect-square p-0 bg-foreground/5 hover:bg-destructive/10 hover:text-destructive border-foreground/5 rounded-xl h-10 w-10 transition-all"
            onClick={() => onDelete(item.id)}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
