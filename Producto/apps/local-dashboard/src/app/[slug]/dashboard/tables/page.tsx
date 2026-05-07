"use client";

import React, { useState } from "react";
import LocalShell from "../_components/LocalShell";
import { useTables } from "@/hooks/useTables";
import { TableRecord } from "@menu-bites/ui";

// Components
import { TableToolbar } from "./_components/TableToolbar";
import { TableGrid } from "./_components/TableGrid";
import { TableModal } from "./_components/TableModal";

export default function TablesPage() {
  const {
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
  } = useTables();

  return (
    <LocalShell title="Gestión" subtitle="Mesas">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold mb-6">
          {error}
        </div>
      )}

      <TableToolbar onCreate={openCreate} />

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">
            Organizando el salón...
          </p>
        </div>
      ) : (
        <TableGrid
          tables={tables}
          deleteId={deleteId}
          onEdit={openEdit}
          onDelete={deleteTable}
        />
      )}

      <TableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingTable={editingTable}
        form={form}
        setForm={setForm}
        saving={saving}
        onSave={handleSave}
      />
    </LocalShell>
  );
}
