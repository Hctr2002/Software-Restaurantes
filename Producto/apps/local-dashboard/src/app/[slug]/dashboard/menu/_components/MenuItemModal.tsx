"use client";

import React, { useRef, useState, useEffect } from "react";
import { Modal, Button } from "@menu-bites/ui";
import { Loader2 } from "lucide-react";
import { MenuItem, Category } from "@/app/[slug]/dashboard/_components/localShared";
import MenuFormFields from "./MenuFormFields";

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: MenuItem | null;
  categories: Category[];
  form: any;
  setForm: (form: any) => void;
  onSave: (imageFile: File | null, currentPreview: string | null) => Promise<void>;
  saving: boolean;
}

/**
 * MenuItemModal
 * 
 * Contenedor del modal para crear o editar platos.
 * Orquesta el estado de la imagen y delega los campos del formulario a MenuFormFields.
 */
export function MenuItemModal({
  isOpen,
  onClose,
  editingItem,
  categories,
  form,
  setForm,
  onSave,
  saving,
}: MenuItemModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar previsualización de imagen al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setImageFile(null);
      setImagePreview(editingItem?.image_url ?? null);
    }
  }, [isOpen, editingItem]);

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

  const handleLocalSave = async () => {
    await onSave(imageFile, imagePreview);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? "Editar Plato" : "Nuevo Plato"}
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-foreground/50 hover:bg-white/5 hover:text-foreground rounded-xl font-bold uppercase tracking-widest text-[10px]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleLocalSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-primary/20 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Plato"}
          </Button>
        </div>
      }
    >
      <MenuFormFields
        form={form}
        setForm={setForm}
        categories={categories}
        imagePreview={imagePreview}
        fileInputRef={fileInputRef}
        onImageChange={handleImageChange}
        onClearImage={clearImage}
      />
    </Modal>
  );
}
