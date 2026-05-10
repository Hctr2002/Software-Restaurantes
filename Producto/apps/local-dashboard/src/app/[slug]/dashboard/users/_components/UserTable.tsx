"use client";

import React from "react";
import { Table, TableRow, TableCell, Badge, Button } from "@menu-bites/ui";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { formatDate, LocalUserRecord } from "@/app/[slug]/dashboard/_components/localShared";

interface UserTableProps {
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
  if (role === "BAR") return "info";
  return "neutral";
}

export function UserTable({ users, onEdit, onDelete, deleteId }: UserTableProps) {
  return (
    <div className="hidden lg:block">
      <Table headers={["Correo", "Rol", "Creado", "Acciones"]}>
        {users.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-foreground/40 py-12 font-bold uppercase tracking-widest text-xs">
              No hay usuarios registrados. Crea el primero.
            </TableCell>
          </TableRow>
        )}
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="font-black text-foreground text-sm tracking-tight">{user.email}</div>
              <div className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">{user.id}</div>
            </TableCell>
            <TableCell>
              <Badge variant={roleVariant(user.role)} className="px-4 py-1 text-[10px] font-black">
                {user.role}
              </Badge>
            </TableCell>
            <TableCell className="text-foreground/40 text-[11px] font-bold">
              {formatDate(user.createdAt)}
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-xl text-foreground/40 hover:text-primary hover:bg-primary/10 transition-all"
                  onClick={() => onEdit(user)}
                >
                  < Pencil className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-xl text-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
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
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
