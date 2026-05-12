import React from "react";
import { Modal, Button, Input } from "@menu-bites/ui";
import { Loader2 } from "lucide-react";
import { Category } from "../../_components/localShared";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCat: Category | null;
  form: { name: string; is_active: boolean; target_station: "KITCHEN" | "BAR" };
  setForm: (form: { name: string; is_active: boolean; target_station: "KITCHEN" | "BAR" }) => void;
  saving: boolean;
  onSave: () => void;
}

export function CategoryModal({
  isOpen,
  onClose,
  editingCat,
  form,
  setForm,
  saving,
  onSave,
}: CategoryModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCat ? "Editar Categoría" : "Nueva Categoría"}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-foreground/50 hover:bg-foreground/5 hover:text-foreground rounded-xl font-bold uppercase tracking-widest text-[10px]"
          >
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-primary/20 transition-all"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Guardar Categoría"
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-8 py-4">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">
            Nombre de la Categoría *
          </label>
          <Input
            placeholder="Ej. Entradas, Bebidas, Postres"
            className="bg-foreground/5 border-foreground/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-medium uppercase italic"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">
            Estación de preparación *
          </label>
          <div className="flex gap-3">
            {(["KITCHEN", "BAR"] as const).map((station) => (
              <button
                key={station}
                type="button"
                onClick={() => setForm({ ...form, target_station: station })}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  form.target_station === station
                    ? "bg-primary/20 border-primary/60 text-primary"
                    : "bg-foreground/5 border-foreground/10 text-foreground/40 hover:border-foreground/20"
                }`}
              >
                {station === "KITCHEN" ? "Cocina" : "Barra"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-foreground/5 border border-foreground/5">
          <input
            type="checkbox"
            id="cat_active"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="w-5 h-5 rounded-lg accent-primary border-foreground/10 bg-foreground/5 cursor-pointer"
          />
          <label
            htmlFor="cat_active"
            className="text-[10px] font-black text-foreground uppercase tracking-widest cursor-pointer select-none"
          >
            Categoría activa
          </label>
        </div>
      </div>
    </Modal>
  );
}
