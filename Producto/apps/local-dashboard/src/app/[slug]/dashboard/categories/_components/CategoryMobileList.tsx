/**
 * CategoryMobileList — Vista de tarjetas de categorías para pantallas móviles (visible en lg:hidden).
 * Cada tarjeta muestra nombre, estado y acciones de editar/eliminar.
 */
import React from "react";
import { Badge, Button } from "@menu-bites/ui";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Category } from "../../_components/localShared";

interface CategoryMobileListProps {
  categories: Category[];
  deleteId: string | null;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
}

export function CategoryMobileList({
  categories,
  deleteId,
  onEdit,
  onDelete,
}: CategoryMobileListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:hidden">
      {categories.length === 0 && (
        <div className="py-12 text-center glass rounded-[2.5rem] border-foreground/5 text-foreground/40 font-bold uppercase tracking-widest text-[10px]">
          No hay categorías registradas.
        </div>
      )}
      {categories.map((cat) => (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={cat.id}
          className="glass-premium p-6 rounded-[2.5rem] border-foreground/10 space-y-4 relative overflow-hidden shadow-lg"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-black text-foreground text-base tracking-tight uppercase italic truncate">
              {cat.name}
            </h3>
            <Badge
              variant={cat.is_active ? "success" : "neutral"}
              className="px-3 py-1 text-[9px] font-black uppercase tracking-widest"
            >
              {cat.is_active ? "Activa" : "Pausada"}
            </Badge>
          </div>

          <div className="pt-4 border-t border-foreground/5 flex gap-2">
            <Button
              className="flex-1 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-primary/20 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest transition-all"
              onClick={() => onEdit(cat)}
            >
              <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
            </Button>
            <Button
              variant="ghost"
              className="aspect-square p-0 bg-foreground/[0.05] hover:bg-destructive/10 hover:text-destructive border-foreground/10 rounded-xl h-10 w-10 transition-all"
              onClick={() => onDelete(cat.id)}
              disabled={deleteId === cat.id}
            >
              {deleteId === cat.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
