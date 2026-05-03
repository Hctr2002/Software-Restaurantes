"use client";

import React, { useCallback, useEffect, useState } from "react";
import LocalShell from "../_components/LocalShell";
import { Table, TableRow, TableCell, Modal, Badge } from "@menu-bites/ui";
import { Category } from "../_components/localShared";
import { Button, Input } from "@menu-bites/ui";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const EMPTY_FORM = { name: "", is_active: true };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/local/categories", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error cargando categorías");
      setCategories(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openCreate = () => { setEditingCat(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
  const openEdit = (cat: Category) => { setEditingCat(cat); setForm({ name: cat.name, is_active: cat.is_active }); setIsModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), is_active: form.is_active };
      const res = editingCat
        ? await fetch(`/api/local/categories/${editingCat.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/local/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error guardando categoría");
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta categoría? Esto podría afectar a los items asociados.")) return;
    setDeleteId(id);
    try {
      const res = await fetch(`/api/local/categories/${id}`, { method: "DELETE" });
      if (!res.ok) { const json = await res.json(); throw new Error(json.error || "Error eliminando categoría"); }
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <LocalShell title="Gestión" subtitle="Categorías">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold mb-6">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-8">
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold h-11 px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95">
          <Plus className="w-4 h-4 mr-2" /> Nueva Categoría
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">Sincronizando categorías...</p>
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {categories.length === 0 && (
              <div className="py-12 text-center glass rounded-[2.5rem] border-white/5 text-foreground/40 font-bold uppercase tracking-widest text-[10px]">
                No hay categorías registradas.
              </div>
            )}
            {categories.map((cat) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={cat.id}
                className="glass p-6 rounded-[2rem] border-white/5 space-y-4 relative overflow-hidden"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-foreground text-base tracking-tight uppercase italic truncate">{cat.name}</h3>
                  <Badge variant={cat.is_active ? "success" : "neutral"} className="px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                    {cat.is_active ? "Activa" : "Pausada"}
                  </Badge>
                </div>
                
                <div className="pt-4 border-t border-white/5 flex gap-2">
                  <Button 
                    className="flex-1 bg-white/5 hover:bg-primary/10 hover:text-primary border-white/5 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest transition-all"
                    onClick={() => openEdit(cat)}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                  </Button>
                  <Button 
                    variant="ghost"
                    className="aspect-square p-0 bg-white/5 hover:bg-destructive/10 hover:text-destructive border-white/5 rounded-xl h-10 w-10 transition-all"
                    onClick={() => handleDelete(cat.id)}
                    disabled={deleteId === cat.id}
                  >
                    {deleteId === cat.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block">
            <Table headers={["Nombre", "Estado", "Acciones"]}>
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-foreground/40 py-12 font-bold uppercase tracking-widest text-xs">No hay categorías. Crea la primera.</TableCell>
                </TableRow>
              )}
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-black text-foreground text-sm tracking-tight uppercase italic">{cat.name}</TableCell>
                  <TableCell>
                    <Badge variant={cat.is_active ? "success" : "neutral"} className="px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                      {cat.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-foreground/40 hover:text-primary hover:bg-primary/10 transition-all"
                        onClick={() => openEdit(cat)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                        onClick={() => handleDelete(cat.id)}
                        disabled={deleteId === cat.id}
                      >
                        {deleteId === cat.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCat ? "Editar Categoría" : "Nueva Categoría"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-foreground/50 hover:bg-white/5 hover:text-foreground rounded-xl font-bold uppercase tracking-widest text-[10px]">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-primary/20 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Categoría"}
            </Button>
          </>
        }
      >
        <div className="space-y-8 py-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">Nombre de la Categoría *</label>
            <Input 
              placeholder="Ej. Entradas, Bebidas, Postres" 
              className="bg-white/5 border-white/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-medium uppercase italic"
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
            />
          </div>
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
            <input 
              type="checkbox" 
              id="cat_active" 
              checked={form.is_active} 
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })} 
              className="w-5 h-5 rounded-lg accent-primary border-white/10 bg-white/5 cursor-pointer" 
            />
            <label htmlFor="cat_active" className="text-[10px] font-black text-foreground uppercase tracking-widest cursor-pointer select-none">Categoría activa</label>
          </div>
        </div>
      </Modal>
    </LocalShell>
  );
}
