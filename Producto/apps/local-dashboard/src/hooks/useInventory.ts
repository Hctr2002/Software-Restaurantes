"use client";

import { useState, useCallback, useRef, useEffect, RefObject } from "react";
import { Inventory } from "@menu-bites/auth";

export type ImportStatus = "idle" | "uploading" | "success" | "error";

const EMPTY_FORM = { name: "", stock: "", unit: "unidades" };

export function useInventory() {
  const [items, setItems] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  
  // Estados de UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fileInputRef = useRef<HTMLInputElement>(null) as RefObject<HTMLInputElement | null>;

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

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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

  const saveItem = async () => {
    if (!form.name.trim() || form.stock === "" || !form.unit.trim()) return;
    
    setSaving(true);
    try {
      const payload = { 
        name: form.name.trim(), 
        stock: parseFloat(form.stock), 
        unit: form.unit 
      };

      const res = editingItem?.id
        ? await fetch(`/api/local/inventory/${editingItem.id}`, { 
            method: "PUT", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify(payload) 
          })
        : await fetch("/api/local/inventory", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify(payload) 
          });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error guardando item");
      
      setIsModalOpen(false);
      await fetchItems();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm("¿Eliminar este ingrediente?")) return;
    setDeleteId(id);
    try {
      const res = await fetch(`/api/local/inventory/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Error eliminando item");
      }
      await fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setDeleteId(null);
    }
  };

  const handleImportCSV = async (file: File) => {
    setImportStatus("uploading");
    setImportMessage(null);
    try {
      const text = await file.text();
      const res  = await fetch("/api/local/inventory/import", {
        method: "POST",
        headers: { "Content-Type": "text/plain; charset=utf-8" },
        body: text,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al importar");
      const errNote = json.errors?.length ? ` (${json.errors.length} fila(s) con error)` : "";
      setImportMessage(`${json.updated} ítem(s) actualizados${errNote}.`);
      setImportStatus("success");
      await fetchItems();
      setTimeout(() => { setImportStatus("idle"); setImportMessage(null); }, 4000);
    } catch (err) {
      setImportMessage(err instanceof Error ? err.message : "Error inesperado");
      setImportStatus("error");
    }
  };

  const exportCSV = () => {
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

  return {
    items,
    loading,
    error,
    saving,
    deleteId,
    importStatus,
    importMessage,
    fileInputRef,
    isModalOpen,
    setIsModalOpen,
    editingItem,
    form,
    setForm,
    openCreate,
    openEdit,
    fetchItems,
    saveItem,
    deleteItem,
    handleImportCSV,
    exportCSV,
  };
}
