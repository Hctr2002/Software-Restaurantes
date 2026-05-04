"use client";

import React, { useCallback, useEffect, useState } from "react";
import LocalShell from "../_components/LocalShell";
import { Table, TableRow, TableCell, Modal, Badge } from "@menu-bites/ui";
import { Button, Input } from "@menu-bites/ui";
import { Inventory } from "../_components/localShared";
import { Plus, Pencil, Trash2, Loader2, AlertTriangle, Package, Download } from "lucide-react";
import { motion } from "framer-motion";

const UNITS = ["unidades", "kg", "g", "L", "mL", "porciones"];
const LOW_STOCK_THRESHOLD = 5;

const EMPTY_FORM = { name: "", stock: "", unit: "unidades" };

function stockVariant(stock: number): "success" | "warning" | "danger" {
  if (stock <= 0) return "danger";
  if (stock <= LOW_STOCK_THRESHOLD) return "warning";
  return "success";
}

export default function InventoryPage() {
  const [items, setItems]         = useState<Inventory[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [deleteId, setDeleteId]   = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/local/inventory", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error cargando inventario");
      setItems(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (item: Inventory) => {
    setEditingItem(item);
    setForm({ name: item.name, stock: String(item.stock), unit: item.unit });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.stock === "" || !form.unit.trim()) return;
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), stock: parseFloat(form.stock), unit: form.unit };
      const res = editingItem
        ? await fetch(`/api/local/inventory/${editingItem.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/local/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error guardando item");
      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este ingrediente?")) return;
    setDeleteId(id);
    try {
      const res = await fetch(`/api/local/inventory/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Error eliminando item");
      }
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setDeleteId(null);
    }
  };

  const criticalItems = items.filter((i) => i.stock <= 0);
  const lowItems      = items.filter((i) => i.stock > 0 && i.stock <= LOW_STOCK_THRESHOLD);
  const lowStockCount = criticalItems.length + lowItems.length;

  const handleExportCSV = () => {
    const lines = [
      "id,nombre,stock_actual,unidad",
      ...items.map((i) =>
        `${i.id},"${i.name.replace(/"/g, '""')}",${Number(i.stock).toFixed(2)},${i.unit}`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "inventario.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <LocalShell title="Gestión" subtitle="Inventario">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold mb-6">
          {error}
        </div>
      )}

      {/* Sección Stock Crítico */}
      {(criticalItems.length > 0 || lowItems.length > 0) && (
        <div className="mb-8 space-y-3">
          {criticalItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black text-red-400 uppercase tracking-widest">
                <AlertTriangle className="w-3.5 h-3.5" />
                Agotados — {criticalItems.length} ítem(s)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {criticalItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="text-red-300 text-sm font-bold truncate">{item.name}</span>
                    </div>
                    <span className="text-red-400 text-xs font-black ml-2 tabular-nums shrink-0">0 {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black text-yellow-400 uppercase tracking-widest">
                <AlertTriangle className="w-3.5 h-3.5" />
                Stock Bajo — {lowItems.length} ítem(s) (≤ {LOW_STOCK_THRESHOLD})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {lowItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-yellow-400 shrink-0" />
                      <span className="text-yellow-300 text-sm font-bold truncate">{item.name}</span>
                    </div>
                    <span className="text-yellow-400 text-xs font-black ml-2 tabular-nums shrink-0">
                      {Number(item.stock).toFixed(2)} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 mb-8">
        <Button
          variant="ghost"
          onClick={handleExportCSV}
          disabled={items.length === 0}
          className="border border-white/10 hover:bg-white/5 text-foreground/60 hover:text-foreground font-bold h-11 px-5 rounded-2xl transition-all active:scale-95 gap-2"
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </Button>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold h-11 px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Ingrediente
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">Contando existencias...</p>
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {items.length === 0 && (
              <div className="py-12 text-center glass rounded-[2.5rem] border-white/5 text-foreground/40 font-bold uppercase tracking-widest text-[10px]">
                Inventario vacío.
              </div>
            )}
            {items.map((item) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.id}
                className="glass p-6 rounded-[2rem] border-white/5 space-y-4 relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/5 text-primary">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-foreground text-base tracking-tight uppercase italic leading-none">{item.name}</h3>
                      <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest mt-1">{item.unit}</p>
                    </div>
                  </div>
                  <Badge variant={stockVariant(item.stock)} className="px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                    {item.stock <= 0 ? "Agotado" : item.stock <= LOW_STOCK_THRESHOLD ? "Bajo" : "OK"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Disponible</div>
                  <div className={`text-xl font-black italic ${item.stock <= LOW_STOCK_THRESHOLD ? 'text-yellow-500' : 'text-primary'}`}>
                    {item.stock} <span className="text-[10px] uppercase tracking-widest italic opacity-40 ml-1">{item.unit}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-2">
                  <Button 
                    className="flex-1 bg-white/5 hover:bg-primary/10 hover:text-primary border-white/5 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest transition-all"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-2" /> Ajustar
                  </Button>
                  <Button 
                    variant="ghost"
                    className="aspect-square p-0 bg-white/5 hover:bg-destructive/10 hover:text-destructive border-white/5 rounded-xl h-10 w-10 transition-all"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteId === item.id}
                  >
                    {deleteId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block">
            <Table headers={["Ingrediente", "Stock Actual", "Unidad", "Estado", "Acciones"]}>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-foreground/40 py-12 font-bold uppercase tracking-widest text-xs">No hay ingredientes en el inventario.</TableCell>
                </TableRow>
              )}
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/5 text-primary/40">
                        <Package className="w-4 h-4" />
                      </div>
                      <span className="font-black text-foreground text-sm tracking-tight uppercase italic">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-black text-sm italic ${item.stock <= LOW_STOCK_THRESHOLD ? "text-yellow-500" : "text-foreground/80"}`}>
                      {item.stock}
                    </span>
                  </TableCell>
                  <TableCell className="text-foreground/30 text-[10px] font-bold uppercase tracking-widest">{item.unit}</TableCell>
                  <TableCell>
                    <Badge variant={stockVariant(item.stock)} className="px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                      {item.stock <= 0 ? "Agotado" : item.stock <= LOW_STOCK_THRESHOLD ? "Stock bajo" : "En Stock"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-foreground/40 hover:text-primary hover:bg-primary/10 transition-all"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteId === item.id}
                      >
                        {deleteId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
        title={editingItem ? "Ajustar Inventario" : "Nuevo Ingrediente"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-foreground/50 hover:bg-white/5 hover:text-foreground rounded-xl font-bold uppercase tracking-widest text-[10px]">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-primary/20 transition-all">
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
                {UNITS.map((u) => <option key={u} value={u} className="bg-background">{u}</option>)}
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
    </LocalShell>
  );
}
