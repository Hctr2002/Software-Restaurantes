import React from "react";
import { Badge } from "@menu-bites/ui";
import { Table as TableIcon, Trash2, Loader2 } from "lucide-react";
import { TableRecord } from "@menu-bites/ui";
import { motion } from "framer-motion";

interface TableGridProps {
  tables: TableRecord[];
  deleteId: string | null;
  onEdit: (table: TableRecord) => void;
  onDelete: (id: string) => void;
}

export function tableStatusVariant(status: string) {
  if (status === "FREE") return "success";
  if (status === "OCCUPIED") return "danger";
  if (status === "RESERVED") return "warning";
  return "neutral";
}

export function TableGrid({
  tables,
  deleteId,
  onEdit,
  onDelete,
}: TableGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {tables.length === 0 && (
        <div className="col-span-full py-20 text-center glass rounded-[2.5rem] border-white/5">
          <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">
            No hay mesas configuradas aún.
          </p>
        </div>
      )}
      {tables.map((table) => (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          key={table.id}
          className="glass p-6 rounded-[2.5rem] border-white/5 relative overflow-hidden group cursor-pointer hover:border-primary/20 transition-all duration-300"
          onClick={() => onEdit(table)}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div
              className={`p-4 rounded-[1.5rem] bg-white/5 transition-transform group-hover:scale-110 ${
                table.status === "OCCUPIED"
                  ? "text-destructive"
                  : table.status === "RESERVED"
                  ? "text-amber-500"
                  : "text-primary"
              }`}
            >
              <TableIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-foreground text-2xl tracking-tighter italic uppercase leading-none">
                Mesa {table.number}
              </h3>
              <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.2em] mt-1">
                {table.label || "Principal"}
              </p>
            </div>
            <Badge
              variant={tableStatusVariant(table.status)}
              className="px-3 py-1 text-[9px] font-black uppercase tracking-widest"
            >
              {table.status}
            </Badge>
          </div>

          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(table.id);
              }}
              disabled={deleteId === table.id}
              className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all"
            >
              {deleteId === table.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
