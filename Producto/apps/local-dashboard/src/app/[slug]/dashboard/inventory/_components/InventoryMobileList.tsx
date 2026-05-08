"use client";

import { motion } from "framer-motion";
import { Badge, Button } from "@menu-bites/ui";
import { Package, Pencil, Trash2, Loader2 } from "lucide-react";
import { Inventory } from "@menu-bites/auth";
import { LOW_STOCK_THRESHOLD } from "@menu-bites/auth";

interface InventoryMobileListProps {
  items: Inventory[];
  deleteId: string | null;
  onEdit: (item: Inventory) => void;
  onDelete: (id: string) => void;
}

function stockVariant(stock: number): "success" | "warning" | "danger" {
  if (stock <= 0) return "danger";
  if (stock <= LOW_STOCK_THRESHOLD) return "warning";
  return "success";
}

export default function InventoryMobileList({ items, deleteId, onEdit, onDelete }: InventoryMobileListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:hidden">
      {items.length === 0 && (
        <div className="py-12 text-center glass rounded-[2.5rem] border-white/5 text-foreground/40 font-bold uppercase tracking-widest text-[10px]">
          Inventario vacío.
        </div>
      )}
      {items.map((item) => (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={item.id}
          className="glass p-6 rounded-[2rem] border-white/5 space-y-4 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/5 text-primary">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-foreground text-base tracking-tight uppercase italic leading-none">{item.name}</h3>
                <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest mt-1">{item.unit}</p>
              </div>
            </div>
            <Badge variant={stockVariant(item.stock)} className="px-3 py-1 text-[9px] font-black uppercase tracking-widest">
              {item.stock <= 0 ? "Agotado" : item.stock <= LOW_STOCK_THRESHOLD ? "Bajo" : "OK"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Disponible</div>
            <div className={`text-xl font-black italic ${item.stock <= LOW_STOCK_THRESHOLD ? 'text-yellow-500' : 'text-primary'}`}>
              {item.stock} <span className="text-[10px] uppercase tracking-widest italic opacity-40 ml-1">{item.unit}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex gap-2">
            <Button 
              className="flex-1 bg-white/5 hover:bg-primary/10 hover:text-primary border-white/5 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest transition-all"
              onClick={() => onEdit(item)}
            >
              <Pencil className="w-3.5 h-3.5 mr-2" /> Ajustar
            </Button>
            <Button 
              variant="ghost"
              className="aspect-square p-0 bg-white/5 hover:bg-destructive/10 hover:text-destructive border-white/5 rounded-xl h-10 w-10 transition-all"
              onClick={() => onDelete(item.id)}
              disabled={deleteId === item.id}
            >
              {deleteId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
