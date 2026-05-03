"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import LocalShell from "../_components/LocalShell";
import { Modal, Badge } from "@menu-bites/ui";
import { formatPrice, MenuItem, Category } from "../_components/localShared";
import { Button, Input } from "@menu-bites/ui";
import { Plus, Pencil, Trash2, Loader2, ImagePlus, X, Power } from "lucide-react";
import { supabase, getSession, getAppMetadata } from "@menu-bites/auth";
import { motion, AnimatePresence } from "framer-motion";

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
    if (!window.confirm("¿Eliminar este item del menú?")) return;
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
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold mb-6">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-8">
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold h-11 px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Item
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">Cocinando tu menú...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.length === 0 && (
            <div className="col-span-full py-20 text-center glass rounded-[2.5rem] border-white/5">
              <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">No hay platos registrados todavía.</p>
            </div>
          )}
          {items.map((item) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={item.id}
              className={`glass rounded-[2rem] border-white/5 overflow-hidden flex flex-col group transition-all duration-300 ${!item.is_active && 'opacity-60 grayscale-[0.5]'}`}
            >
              {/* Image Header */}
              <div className="relative h-48 overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <ImagePlus className="w-8 h-8 text-foreground/10" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge variant={item.is_active ? "success" : "neutral"} className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-background/80 backdrop-blur-md border-white/10">
                    {item.is_active ? "En Venta" : "Pausado"}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${item.is_active ? "bg-primary/20 text-primary hover:bg-primary hover:text-white" : "bg-white/10 text-white hover:bg-primary"}`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-black text-foreground text-lg tracking-tight leading-tight uppercase italic">{item.name}</h3>
                    <span className="font-black text-primary text-base shrink-0">{formatPrice(item.price)}</span>
                  </div>
                  <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{item.categories?.name || 'General'}</p>
                  {item.description && <p className="text-xs text-foreground/40 font-medium line-clamp-2 leading-relaxed">{item.description}</p>}
                </div>

                <div className="pt-6 mt-auto border-t border-white/5 flex gap-2">
                  <Button 
                    className="flex-1 bg-white/5 hover:bg-primary/10 hover:text-primary border-white/5 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest transition-all"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
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
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Editar Item" : "Nuevo Item"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-foreground/50 hover:bg-white/5 hover:text-foreground rounded-xl font-bold uppercase tracking-widest text-[10px]">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-primary/20 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Plato"}
            </Button>
          </>
        }
      >
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">Imagen del Plato</label>
            {imagePreview ? (
              <div className="relative w-full h-48 rounded-[2rem] overflow-hidden border border-white/10 group">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={clearImage}
                    className="p-3 rounded-full bg-destructive text-white hover:scale-110 transition-transform"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 rounded-[2rem] border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-3 text-foreground/20 hover:border-primary/50 hover:text-primary transition-all group"
              >
                <div className="p-4 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform">
                  <ImagePlus className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-black uppercase tracking-widest">Subir Imagen</span>
                  <span className="text-[9px] font-bold text-foreground/10 uppercase tracking-widest">JPG, PNG, WebP — máx. 5MB</span>
                </div>
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

          <div className="space-y-3">
            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">Nombre del Plato *</label>
            <Input placeholder="Ej. Lomo a la plancha" className="bg-white/5 border-white/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-medium" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">Descripción Corta</label>
            <Input placeholder="Descripción para el cliente" className="bg-white/5 border-white/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-medium" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">Precio *</label>
              <Input type="number" min="0" placeholder="0" className="bg-white/5 border-white/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-black" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">Categoría *</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="" className="bg-background">Categoría...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-background">{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-5 h-5 rounded-lg accent-primary border-white/10 bg-white/5 cursor-pointer"
            />
            <label htmlFor="is_active" className="text-[10px] font-black text-foreground uppercase tracking-widest cursor-pointer select-none">Item activo (visible en el menú)</label>
          </div>
        </div>
      </Modal>
    </LocalShell>
  );
}
