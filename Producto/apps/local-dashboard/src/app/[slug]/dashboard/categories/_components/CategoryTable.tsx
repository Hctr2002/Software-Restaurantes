import React from "react";
import { Table, TableRow, TableCell, Badge, Button } from "@menu-bites/ui";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Category } from "../../_components/localShared";

interface CategoryTableProps {
  categories: Category[];
  deleteId: string | null;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
}

export function CategoryTable({
  categories,
  deleteId,
  onEdit,
  onDelete,
}: CategoryTableProps) {
  return (
    <div className="hidden lg:block">
      <Table headers={["Nombre", "Estado", "Acciones"]}>
        {categories.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={3}
              className="text-center text-foreground/40 py-12 font-bold uppercase tracking-widest text-xs"
            >
              No hay categorías. Crea la primera.
            </TableCell>
          </TableRow>
        )}
        {categories.map((cat) => (
          <TableRow key={cat.id}>
            <TableCell className="font-black text-foreground text-sm tracking-tight uppercase italic">
              {cat.name}
            </TableCell>
            <TableCell>
              <Badge
                variant={cat.is_active ? "success" : "neutral"}
                className="px-4 py-1 text-[10px] font-black uppercase tracking-widest"
              >
                {cat.is_active ? "Activa" : "Inactiva"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-foreground/40 hover:text-primary hover:bg-primary/10 transition-all"
                  onClick={() => onEdit(cat)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
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
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
