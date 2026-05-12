"use client";

import React from "react";
import { motion } from "framer-motion";
import { Badge, Button } from "@menu-bites/ui";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { formatDate, LocalUserRecord } from "@/app/[slug]/dashboard/_components/localShared";

interface UserMobileListProps {
  users: LocalUserRecord[];
  onEdit: (user: LocalUserRecord) => void;
  onDelete: (id: string) => void;
  deleteId: string | null;
}

type BadgeVariant = "success" | "danger" | "warning" | "neutral" | "info";

function roleVariant(role: string): BadgeVariant {
  if (role === "ADMIN") return "info";
  if (role === "COCINA") return "warning";
  if (role === "CAJERO") return "success";
  if (role === "GARZON") return "neutral";
  return "neutral";
}

export function UserMobileList({ users, onEdit, onDelete, deleteId }: UserMobileListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:hidden">
      {users.length === 0 && (
        <div className="py-12 text-center glass rounded-[2.5rem] border-foreground/5 text-foreground/40 font-bold uppercase tracking-widest text-[10px]">
          No hay usuarios registrados.
        </div>
      )}
      {users.map((user) => (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={user.id}
          className="glass p-6 rounded-[2rem] border-foreground/5 space-y-4 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div className="overflow-hidden">
              <h3 className="font-black text-foreground text-base tracking-tight truncate leading-tight mb-1">{user.email}</h3>
              <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest truncate">{user.id}</p>
            </div>
            <Badge variant={roleVariant(user.role)} className="px-3 py-1 text-[9px] font-black">
              {user.role}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-[10px] font-bold pt-2">
            <span className="text-foreground/30 uppercase tracking-widest">Creado</span>
            <span className="text-foreground/60">{formatDate(user.createdAt)}</span>
          </div>

          <div className="pt-4 border-t border-foreground/5 flex gap-2">
            <Button 
              className="flex-1 bg-foreground/5 hover:bg-primary/10 hover:text-primary border-foreground/5 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest transition-all"
              onClick={() => onEdit(user)}
            >
              <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
            </Button>
            <Button 
              variant="ghost"
              className="aspect-square p-0 bg-foreground/5 hover:bg-destructive/10 hover:text-destructive border-foreground/5 rounded-xl h-10 w-10 transition-all"
              onClick={() => {
                if (window.confirm("¿Eliminar usuario de forma permanente?")) {
                  onDelete(user.id);
                }
              }}
              disabled={deleteId === user.id}
            >
              {deleteId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
