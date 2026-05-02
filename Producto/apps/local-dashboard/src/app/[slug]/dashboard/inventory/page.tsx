"use client";

import React, { useCallback, useEffect, useState } from "react";
import LocalShell from "../_components/LocalShell";
import { Table, TableRow, TableCell, Modal, Badge } from "@menu-bites/ui";
import { Button, Input } from "@menu-bites/ui";
import { Inventory } from "../_components/localShared";
import { Plus, Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react";

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

  const lowStockCount = items.filter((i) => i.stock <= LOW_STOCK_THRESHOLD).length;

  return (
    <LocalShell title="Gestión" subtitle="Inventario">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold">
          {error}
        </div>
      )}

      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-sm text-yellow-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>
            <strong>{lowStockCount}</strong> {lowStockCount === 1 ? "ingrediente tiene" : "ingredientes tienen"} stock bajo o agotado.
            Considera deshabilitar los platos afectados desde la sección <strong>Menú</strong>.
          </span>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Ingrediente
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando inventario...</p>
      ) : (
        <Table headers={["Ingrediente", "Stock", "Unidad", "Estado", "Acciones"]}>
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No hay ingredientes en el inventario. Crea el primero.
              </TableCell>
            </TableRow>
          )}
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium text-slate-200">{item.name}</TableCell>
              <TableCell className="font-mono text-slate-300">
                <span className={item.stock <= LOW_STOCK_THRESHOLD ? "text-yellow-400 font-bold" : ""}>
                  {item.stock}
                </span>
              </TableCell>
              <TableCell className="text-slate-400 text-xs">{item.unit}</TableCell>
              <TableCell>
                <Badge variant={stockVariant(item.stock)}>
                  {item.stock <= 0 ? "Agotado" : item.stock <= LOW_STOCK_THRESHOLD ? "Stock bajo" : "OK"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(item)}
                    className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="Editar / ajustar stock"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteId === item.id}
                    className="p-1.5 rounded hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    {deleteId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Editar Ingrediente" : "Nuevo Ingrediente"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre *</label>
            <Input placeholder="Ej. Tomate, Pollo, Harina" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unidad *</label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          {editingItem && editingItem.stock <= LOW_STOCK_THRESHOLD && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Stock bajo. Actualiza la cantidad o deshabilita los platos que usan este ingrediente desde <strong>Menú</strong>.
            </div>
          )}
        </div>
      </Modal>
    </LocalShell>
  );
}
