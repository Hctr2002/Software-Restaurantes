"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { KDSSettings } from "../../../lib/kdsSettings";

interface Category { id: string; name: string; }

interface Props {
  draft: KDSSettings;
  categories: Category[];
  loadingMenu: boolean;
  onChange: (updated: KDSSettings) => void;
}

export function CategoriesTab({ draft, categories, loadingMenu, onChange }: Props) {
  const [newCatName, setNewCatName] = useState("");
  const [newCatMinutes, setNewCatMinutes] = useState(15);

  const addCategory = () => {
    if (!newCatName.trim()) return;
    onChange({ ...draft, categoryTimes: [...draft.categoryTimes, { name: newCatName.trim(), minutes: newCatMinutes }] });
    setNewCatName("");
    setNewCatMinutes(15);
  };

  const removeCategory = (i: number) =>
    onChange({ ...draft, categoryTimes: draft.categoryTimes.filter((_, idx) => idx !== i) });

  const availableCategories = categories.filter((c) => !draft.categoryTimes.find((ct) => ct.name === c.name));

  return (
    <div className="space-y-4">
      <p className="text-foreground/40 text-sm">Tiempo de preparación objetivo por categoría de bebida.</p>
      {draft.categoryTimes.length === 0 && <p className="text-foreground/20 text-sm text-center py-6">Sin categorías configuradas</p>}
      {draft.categoryTimes.map((ct, i) => (
        <div key={i} className="flex items-center justify-between bg-foreground/5 rounded-2xl px-5 py-4 border border-foreground/5">
          <span className="text-foreground font-semibold text-sm">{ct.name}</span>
          <div className="flex items-center space-x-4">
            <span className="text-primary font-black">{ct.minutes} min</span>
            <button onClick={() => removeCategory(i)} className="text-red-400/60 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      <div className="flex space-x-3 items-end pt-2">
        {loadingMenu ? (
          <div className="flex-1 bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground/30 text-sm">Cargando...</div>
        ) : availableCategories.length > 0 ? (
          <select className="flex-1 bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-1 focus:ring-primary/50" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}>
            <option value="" className="bg-card text-foreground">Seleccionar categoría...</option>
            {availableCategories.map((c) => <option key={c.id} value={c.name} className="bg-card text-foreground">{c.name}</option>)}
          </select>
        ) : (
          <input className="flex-1 bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-foreground/20 outline-none focus:ring-1 focus:ring-primary/50"
            placeholder="Nombre de categoría..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
        )}
        <div className="flex items-center space-x-2 bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3">
          <input type="number" min={1} max={120} value={newCatMinutes} onChange={(e) => setNewCatMinutes(Number(e.target.value))} className="w-12 bg-transparent text-foreground text-sm text-center outline-none" />
          <span className="text-foreground/40 text-xs">min</span>
        </div>
        <button onClick={addCategory} className="px-5 py-3 bg-primary rounded-xl text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
