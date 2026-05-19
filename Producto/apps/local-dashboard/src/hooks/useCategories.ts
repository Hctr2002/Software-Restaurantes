/**
 * useCategories — Hook de gestión CRUD para categorías del menú.
 * Carga las categorías desde /api/local/categories y expone handlers para crear, editar y eliminar.
 */
import { useCallback, useEffect, useState } from "react";
import { Category } from "@/app/[slug]/dashboard/_components/localShared";

/**
 * Provee estado de lista, formulario, modal y acciones CRUD para categorías.
 * No tiene suscripción Realtime; se actualiza manualmente tras cada mutación.
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", is_active: true, target_station: "KITCHEN" as "KITCHEN" | "BAR" });

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

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditingCat(null);
    setForm({ name: "", is_active: true, target_station: "KITCHEN" });
    setIsModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    setForm({ name: cat.name, is_active: cat.is_active, target_station: ((cat.targetStation ?? (cat as any).target_station ?? "KITCHEN") as "KITCHEN" | "BAR") });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = editingCat
        ? await fetch(`/api/local/categories/${editingCat.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          })
        : await fetch("/api/local/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error guardando categoría");
      setIsModalOpen(false);
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm("¿Eliminar esta categoría? Esto podría afectar a los items asociados.")) return;
    setDeleteId(id);
    try {
      const res = await fetch(`/api/local/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Error eliminando categoría");
      }
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setDeleteId(null);
    }
  };

  return {
    categories,
    loading,
    error,
    saving,
    deleteId,
    isModalOpen,
    setIsModalOpen,
    editingCat,
    form,
    setForm,
    openCreate,
    openEdit,
    handleSave,
    deleteCategory,
    fetchCategories
  };
}
