/**
 * InventoryToolbar — Barra de acciones del inventario: exportar CSV, importar CSV y crear insumo.
 * El botón de importar actúa como label de un input file oculto referenciado por fileInputRef.
 */
"use client";

import { Download, Upload, Loader2, Plus } from "lucide-react";
import { Button } from "@menu-bites/ui";
import { ImportStatus } from "@/hooks/useInventory";

interface InventoryToolbarProps {
  importStatus: ImportStatus;
  itemsCount: number;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreate: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function InventoryToolbar({
  importStatus,
  itemsCount,
  onExport,
  onImport,
  onCreate,
  fileInputRef,
}: InventoryToolbarProps) {
  return (
    <div className="flex justify-end gap-3 mb-8">
      <Button
        variant="ghost"
        onClick={onExport}
        disabled={itemsCount === 0}
        className="border border-white/10 hover:bg-white/5 text-foreground/60 hover:text-foreground font-bold h-11 px-5 rounded-2xl transition-all active:scale-95 gap-2"
      >
        <Download className="w-4 h-4" /> Exportar CSV
      </Button>

      <label className={`inline-flex items-center gap-2 h-11 px-5 rounded-2xl border font-bold text-sm cursor-pointer transition-all active:scale-95 ${
        importStatus === "uploading"
          ? "opacity-50 pointer-events-none border-white/10 text-foreground/40"
          : "border-white/10 hover:bg-white/5 text-foreground/60 hover:text-foreground"
      }`}>
        {importStatus === "uploading"
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Upload className="w-4 h-4" />}
        Importar CSV
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="hidden"
          onChange={onImport}
          disabled={importStatus === "uploading"}
        />
      </label>

      <Button onClick={onCreate} className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold h-11 px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95">
        <Plus className="w-4 h-4 mr-2" /> Nuevo Ingrediente
      </Button>
    </div>
  );
}
