"use client";

import { Table, TableRow, TableCell, Badge, Button } from "@menu-bites/ui";
import { Package, Pencil, Trash2, Loader2 } from "lucide-react";
import { Inventory } from "@menu-bites/auth";
import { LOW_STOCK_THRESHOLD } from "@menu-bites/auth";

interface InventoryTableProps {
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

export default function InventoryTable({ items, deleteId, onEdit, onDelete }: InventoryTableProps) {
  return (
    <div className="hidden lg:block">
      <Table headers={["Ingrediente", "Stock Actual", "Unidad", "Estado", "Acciones"]}>
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-foreground/40 py-12 font-bold uppercase tracking-widest text-xs">No hay ingredientes en el inventario.</TableCell>
          </TableRow>
        )}
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5 text-primary/40">
                  <Package className="w-4 h-4" />
                </div>
                <span className="font-black text-foreground text-sm tracking-tight uppercase italic">{item.name}</span>
              </div>
            </TableCell>
            <TableCell>
              <span className={`font-black text-sm italic ${item.stock <= LOW_STOCK_THRESHOLD ? "text-yellow-500" : "text-foreground/80"}`}>
                {item.stock}
              </span>
            </TableCell>
            <TableCell className="text-foreground/30 text-[10px] font-bold uppercase tracking-widest">{item.unit}</TableCell>
            <TableCell>
              <Badge variant={stockVariant(item.stock)} className="px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                {item.stock <= 0 ? "Agotado" : item.stock <= LOW_STOCK_THRESHOLD ? "Stock bajo" : "En Stock"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-xl text-foreground/40 hover:text-primary hover:bg-primary/10 transition-all"
                  onClick={() => onEdit(item)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-xl text-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                  onClick={() => onDelete(item.id)}
                  disabled={deleteId === item.id}
                >
                  {deleteId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
