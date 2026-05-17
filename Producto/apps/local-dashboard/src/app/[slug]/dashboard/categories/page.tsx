/**
 * CategoriesPage — Gestión de categorías del menú (CRUD).
 * Orquesta el hook useCategories y delega la presentación a sub-componentes modularizados.
 */
"use client";

import React, { useState } from "react";
import LocalShell from "../_components/LocalShell";
import { useCategories } from "@/hooks/useCategories";
import { Category } from "../_components/localShared";

// Components
import { CategoryToolbar } from "./_components/CategoryToolbar";
import { CategoryTable } from "./_components/CategoryTable";
import { CategoryMobileList } from "./_components/CategoryMobileList";
import { CategoryModal } from "./_components/CategoryModal";

export default function CategoriesPage() {
  const {
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
  } = useCategories();

  return (
    <LocalShell title="Gestión" subtitle="Categorías">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold mb-6">
          {error}
        </div>
      )}

      <CategoryToolbar onCreate={openCreate} />

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">
            Sincronizando categorías...
          </p>
        </div>
      ) : (
        <>
          <CategoryMobileList
            categories={categories}
            deleteId={deleteId}
            onEdit={openEdit}
            onDelete={deleteCategory}
          />
          <CategoryTable
            categories={categories}
            deleteId={deleteId}
            onEdit={openEdit}
            onDelete={deleteCategory}
          />
        </>
      )}

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingCat={editingCat}
        form={form}
        setForm={setForm}
        saving={saving}
        onSave={handleSave}
      />
    </LocalShell>
  );
}
