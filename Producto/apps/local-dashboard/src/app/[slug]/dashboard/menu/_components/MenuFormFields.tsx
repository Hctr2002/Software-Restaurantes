"use client";

import React from "react";
import { Input } from "@menu-bites/ui";
import { ImagePlus, X } from "lucide-react";
import { Category } from "@/app/[slug]/dashboard/_components/localShared";

interface MenuFormFieldsProps {
  form: any;
  setForm: (form: any) => void;
  categories: Category[];
  imagePreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
}

/**
 * MenuFormFields
 * 
 * Componente modular que contiene todos los campos del formulario para un plato.
 * Aísla la complejidad visual del formulario del contenedor del modal.
 */
export default function MenuFormFields({
  form,
  setForm,
  categories,
  imagePreview,
  fileInputRef,
  onImageChange,
  onClearImage
}: MenuFormFieldsProps) {
  return (
    <div className="space-y-6 py-4">
      {/* Selector de Imagen */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">
          Imagen del Plato
        </label>
        {imagePreview ? (
          <div className="relative w-full h-48 rounded-[2rem] overflow-hidden border border-foreground/10 group">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={onClearImage}
                className="p-3 rounded-full bg-destructive text-primary-foreground hover:scale-110 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-40 rounded-[2rem] border-2 border-dashed border-foreground/10 bg-foreground/5 flex flex-col items-center justify-center gap-3 text-foreground/20 hover:border-primary/50 hover:text-primary transition-all group"
          >
            <div className="p-4 rounded-2xl bg-foreground/5 group-hover:scale-110 transition-transform">
              <ImagePlus className="w-6 h-6" />
            </div>
            <div className="text-center">
              <span className="block text-[10px] font-black uppercase tracking-widest">Subir Imagen</span>
              <span className="text-[9px] font-bold text-foreground/10 uppercase tracking-widest">
                JPG, PNG, WebP — máx. 5MB
              </span>
            </div>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={onImageChange}
          className="hidden"
        />
      </div>

      {/* Nombre y Descripción */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">
          Nombre del Plato *
        </label>
        <Input 
          placeholder="Ej. Lomo a la plancha" 
          className="bg-foreground/5 border-foreground/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-medium" 
          value={form.name} 
          onChange={(e) => setForm({ ...form, name: e.target.value })} 
        />
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">
          Descripción Corta
        </label>
        <Input 
          placeholder="Descripción para el cliente" 
          className="bg-foreground/5 border-foreground/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-medium" 
          value={form.description} 
          onChange={(e) => setForm({ ...form, description: e.target.value })} 
        />
      </div>

      {/* Precio y Categoría */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">
            Precio *
          </label>
          <Input 
            type="number" 
            min="0" 
            placeholder="0" 
            className="bg-foreground/5 border-foreground/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-black" 
            value={form.price} 
            onChange={(e) => setForm({ ...form, price: e.target.value })} 
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">
            Categoría *
          </label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full h-12 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="" className="bg-card text-foreground/50">Categoría...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-card text-foreground">
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Estado Activo */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-foreground/5 border border-foreground/5">
        <input
          type="checkbox"
          id="is_active"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          className="w-5 h-5 rounded-lg accent-primary border-foreground/10 bg-foreground/5 cursor-pointer"
        />
        <label 
          htmlFor="is_active" 
          className="text-[10px] font-black text-foreground uppercase tracking-widest cursor-pointer select-none"
        >
          Item activo (visible en el menú)
        </label>
      </div>
    </div>
  );
}
