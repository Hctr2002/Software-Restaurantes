"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import LocalShell from "../_components/LocalShell";
import { Table, TableRow, TableCell, Modal, Badge } from "@menu-bites/ui";
import { formatPrice, MenuItem, Category } from "../_components/localShared";
import { Button, Input } from "@menu-bites/ui";
import { Plus, Pencil, Trash2, Loader2, ImagePlus, X, Power } from "lucide-react";
import { supabase, getSession, getAppMetadata } from "@menu-bites/auth";

const EMPTY_FORM = { name: "", description: "", price: "", is_active: true, categoryId: "" };

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    fetchItems();
    fetch("/api/local/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setCategories(j.data || []));
  }, [fetchItems]);

  const openCreate = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
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
    setImageFile(null);
    setImagePreview(item.image_url ?? null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.categoryId) {
      setError("Por favor completa todos los campos requeridos (Nombre, Precio y Categoría)");
      return;
    }
    setSaving(true);
    try {
      let image_url: string | null = null;
      if (imageFile) {
        image_url = await uploadImage(imageFile);
      } else {
        image_url = imagePreview;
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
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: MenuItem) => {
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

  const handleDelete = async (id: string) => {
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

  return (
    <LocalShell title="Gestión" subtitle="Menú">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Item
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando menú…</p>
      ) : (
        <Table headers={["", "Nombre", "Categoría", "Precio", "Estado", "Acciones"]}>
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No hay items en el menú. Crea el primero.
              </TableCell>
            </TableRow>
          )}
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} width={40} height={40} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center" aria-hidden="true">
                    <ImagePlus className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </TableCell>
              <TableCell>
                <p className="font-medium text-slate-200">{item.name}</p>
                {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
              </TableCell>
              <TableCell className="text-slate-400 text-xs">
                {item.categories?.name ?? <span className="text-slate-600">—</span>}
              </TableCell>
              <TableCell className="font-mono">{formatPrice(item.price)}</TableCell>
              <TableCell>
                <Badge variant={item.is_active ? "success" : "neutral"}>
                  {item.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(item)}
                    aria-label={item.is_active ? `Deshabilitar ${item.name}` : `Habilitar ${item.name}`}
                    title={item.is_active ? "Deshabilitar plato" : "Habilitar plato"}
                    className={`p-1.5 rounded transition-colors ${item.is_active ? "text-green-500 hover:bg-red-900/20 hover:text-red-400" : "text-slate-600 hover:bg-green-900/20 hover:text-green-400"}`}
                  >
                    <Power className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button 
                    onClick={() => openEdit(item)} 
                    aria-label={`Editar ${item.name}`}
                    className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    aria-label={`Eliminar ${item.name}`}
                    disabled={deleteId === item.id}
                    className="p-1.5 rounded hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    {deleteId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    )}
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
        title={editingItem ? "Editar Item" : "Nuevo Item"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : "Guardar"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Imagen</label>
            {imagePreview ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-700">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  aria-label="Eliminar imagen"
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-blue-600 hover:text-blue-400 transition-colors"
              >
                <ImagePlus className="w-6 h-6" aria-hidden="true" />
                <span className="text-xs">Haz Clic para Subir una Imagen</span>
                <span className="text-xs text-slate-600">JPG, PNG, WebP — máx. 5MB</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre *</label>
            <Input placeholder="Ej. Lomo a la plancha" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Descripción</label>
            <Input placeholder="Descripción opcional" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Precio (CLP) *</label>
            <Input type="number" min="0" step="1" placeholder="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoría *</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <label htmlFor="is_active" className="text-sm text-slate-300">Item activo (visible en el menú)</label>
          </div>
        </div>
      </Modal>
    </LocalShell>
  );
}
