/**
 * InventoryModal — Modal de creación y ajuste de insumos de inventario.
 * Muestra advertencia de stock crítico si el ítem editado está bajo el umbral LOW_STOCK_THRESHOLD.
 */
"use client";

import { Modal, Button, Input } from "@menu-bites/ui";
import { Loader2, AlertTriangle } from "lucide-react";
import { LOW_STOCK_THRESHOLD } from "@menu-bites/auth";
import { Inventory } from "@menu-bites/auth";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: Inventory | null;
  form: { name: string; stock: string; unit: string };
  setForm: (form: { name: string; stock: string; unit: string }) => void;
  saving: boolean;
  onSave: () => void;
  units: string[];
}

export default function InventoryModal({
  isOpen,
  onClose,
  editingItem,
  form,
  setForm,
  saving,
  onSave,
  units,
}: InventoryModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? "Ajustar Inventario" : "Nuevo Ingrediente"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="text-foreground/50 hover:bg-white/5 hover:text-foreground rounded-xl font-bold uppercase tracking-widest text-[10px]">
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={saving} className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-primary/20 transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Ingrediente"}
          </Button>
        </>
      }
    >
      <div className="space-y-8 py-4">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">Nombre del Ingrediente *</label>
          <Input 
            placeholder="Ej. Tomate, Pollo, Harina" 
            className="bg-white/5 border-white/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-medium uppercase italic"
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">Stock Actual *</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              className="bg-white/5 border-white/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-black italic text-lg"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">Unidad de Medida *</label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
            >
              {units.map((u) => <option key={u} value={u} className="bg-background">{u}</option>)}
            </select>
          </div>
        </div>
        {editingItem && editingItem.stock <= LOW_STOCK_THRESHOLD && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold uppercase tracking-wider leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Stock crítico. Actualiza la cantidad para evitar que desaparezcan platos del menú automático.</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
