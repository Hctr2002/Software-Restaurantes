"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, getSession, getAppMetadata } from "@menu-bites/auth";
import { MenuItem, Category } from "@/app/[slug]/dashboard/_components/localShared";

const EMPTY_FORM = { name: "", description: "", price: "", is_active: true, categoryId: "" };

export function useMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/local/menu", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error cargando menú");
      setItems(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/local/categories", { cache: "no-store" });
      const json = await res.json();
      setCategories(json.data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, [fetchItems, fetchCategories]);

  const openCreate = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      is_active: item.is_active,
      categoryId: item.categoryId || "",
    });
    setIsModalOpen(true);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const session = await getSession();
    const { restaurant_id } = getAppMetadata(session);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${restaurant_id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("menu-images").upload(path, file, { upsert: true });
    if (error) throw new Error(`Error subiendo imagen: ${error.message}`);
    const { data: { publicUrl } } = supabase.storage.from("menu-images").getPublicUrl(path);
    return publicUrl;
  };

  const saveItem = async (imageFile: File | null, currentPreview: string | null) => {
    if (!form.name.trim() || !form.price || !form.categoryId) {
      throw new Error("Por favor completa todos los campos requeridos (Nombre, Precio y Categoría)");
    }
    setSaving(true);
    try {
      let image_url: string | null = null;
      if (imageFile) {
        image_url = await uploadImage(imageFile);
      } else {
        image_url = currentPreview;
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        is_active: form.is_active,
        category_id: form.categoryId,
        image_url,
      };

      const res = editingItem
        ? await fetch(`/api/local/menu/${editingItem.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/local/menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error guardando item");
      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: MenuItem) => {
    try {
      const res = await fetch(`/api/local/menu/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          price: item.price,
          is_active: !item.is_active,
          category_id: item.categoryId,
          image_url: item.image_url,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Error actualizando estado");
      }
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  const deleteItem = async (id: string) => {
    setDeleteId(id);
    try {
      const res = await fetch(`/api/local/menu/${id}`, { method: "DELETE" });
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

  return {
    items,
    categories,
    loading,
    error,
    setError,
    isModalOpen,
    setIsModalOpen,
    editingItem,
    form,
    setForm,
    saving,
    deleteId,
    openCreate,
    openEdit,
    saveItem,
    toggleActive,
    deleteItem,
    fetchItems
  };
}
