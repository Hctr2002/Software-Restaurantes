"use client";

import React from "react";
import LocalShell from "../_components/LocalShell";
import { useMenu } from "@/hooks/useMenu";
import { MenuToolbar } from "./_components/MenuToolbar";
import { MenuItemCard } from "./_components/MenuItemCard";
import { MenuItemModal } from "./_components/MenuItemModal";

export default function MenuPage() {
  const {
    items,
    categories,
    loading,
    error,
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
  } = useMenu();

  return (
    <LocalShell title="Gestión" subtitle="Menú">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold mb-6">
          {error}
        </div>
      )}

      <MenuToolbar onAdd={openCreate} />

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">Cocinando tu menú...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.length === 0 && (
            <div className="col-span-full py-20 text-center glass rounded-[2.5rem] border-foreground/5">
              <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">No hay platos registrados todavía.</p>
            </div>
          )}
          {items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onToggleActive={toggleActive}
              onEdit={openEdit}
              onDelete={deleteItem}
              isDeleting={deleteId === item.id}
            />
          ))}
        </div>
      )}

      <MenuItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        categories={categories}
        form={form}
        setForm={setForm}
        onSave={saveItem}
        saving={saving}
      />
    </LocalShell>
  );
}
