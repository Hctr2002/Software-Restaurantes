/**
 * CategoryToolbar — Barra de acciones de la página de categorías.
 * Actualmente solo expone el botón de crear nueva categoría.
 */
import React from "react";
import { Button } from "@menu-bites/ui";
import { Plus } from "lucide-react";

interface CategoryToolbarProps {
  onCreate: () => void;
}

export function CategoryToolbar({ onCreate }: CategoryToolbarProps) {
  return (
    <div className="flex justify-end mb-8">
      <Button
        onClick={onCreate}
        className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold h-11 px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
      >
        <Plus className="w-4 h-4 mr-2" /> Nueva Categoría
      </Button>
    </div>
  );
}
