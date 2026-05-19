/**
 * useTables — Hook de gestión CRUD para mesas del restaurante.
 * Carga las mesas desde /api/local/tables y expone handlers de crear, editar y eliminar.
 */
import { useCallback, useEffect, useState } from "react";
import { TableRecord } from "@menu-bites/ui";

/**
 * Provee la grilla de mesas, formulario de edición y operaciones de persistencia.
 * La eliminación puede fallar con error 409 si la mesa tiene órdenes activas.
 */
export function useTables() {
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableRecord | null>(null);
  const [form, setForm] = useState({ number: "", label: "", status: "FREE" });

  const fetchTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/local/tables", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error cargando mesas");
      setTables(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const openCreate = () => {
    setEditingTable(null);
    setForm({ number: "", label: "", status: "FREE" });
    setIsModalOpen(true);
  };

  const openEdit = (table: TableRecord) => {
    setEditingTable(table);
    setForm({
      number: String(table.number),
      label: table.label || "",
      status: table.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.number) return;
    setSaving(true);
    try {
      const payload = {
        number: parseInt(form.number),
        label: form.label.trim() || null,
        status: form.status,
      };

      const res = editingTable
        ? await fetch(`/api/local/tables/${editingTable.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/local/tables", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error guardando mesa");
      setIsModalOpen(false);
      await fetchTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  const deleteTable = async (id: string) => {
    if (!window.confirm("¿Eliminar esta mesa?")) return;
    setDeleteId(id);
    try {
      const res = await fetch(`/api/local/tables/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Error eliminando mesa");
      }
      await fetchTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setDeleteId(null);
    }
  };

  return {
    tables,
    loading,
    error,
    saving,
    deleteId,
    isModalOpen,
    setIsModalOpen,
    editingTable,
    form,
    setForm,
    openCreate,
    openEdit,
    handleSave,
    deleteTable,
    fetchTables
  };
}
