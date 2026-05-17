/**
 * UserToolbar — Barra de acciones de la página de usuarios.
 * Actualmente solo expone el botón de crear nuevo usuario.
 */
"use client";

import { Button } from "@menu-bites/ui";
import { Plus } from "lucide-react";

interface UserToolbarProps {
  onAdd: () => void;
}

export function UserToolbar({ onAdd }: UserToolbarProps) {
  return (
    <div className="flex justify-end mb-8">
      <Button 
        onClick={onAdd} 
        className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold h-11 px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
      >
        <Plus className="w-4 h-4 mr-2" /> Nuevo Usuario
      </Button>
    </div>
  );
}
