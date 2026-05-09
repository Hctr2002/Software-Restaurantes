"use client";

import React from "react";
import LocalShell from "../_components/LocalShell";
import { useInventory } from "@/hooks/useInventory";

// Components
import InventoryCriticalSection from "./_components/InventoryCriticalSection";
import InventoryToolbar from "./_components/InventoryToolbar";
import InventoryTable from "./_components/InventoryTable";
import InventoryMobileList from "./_components/InventoryMobileList";
import InventoryModal from "./_components/InventoryModal";
import InventoryFeedback from "./_components/InventoryFeedback";

const UNITS = ["unidades", "kg", "g", "L", "mL", "porciones"];

/**
 * InventoryPage - Gestión de Stock e Insumos
 * 
 * Permite controlar el inventario del local, con alertas de stock crítico,
 * importación/exportación CSV y CRUD de ítems.
 */
export default function InventoryPage() {
  const {
    items,
    loading,
    error,
    saving,
    deleteId,
    importStatus,
    importMessage,
    fileInputRef,
    isModalOpen,
    setIsModalOpen,
    editingItem,
    form,
    setForm,
    openCreate,
    openEdit,
    saveItem,
    deleteItem,
    handleImportCSV,
    exportCSV,
  } = useInventory();

  return (
    <LocalShell title="Gestión" subtitle="Inventario">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold mb-6">
          {error}
        </div>
      )}

      {/* Alertas de Stock Crítico */}
      <InventoryCriticalSection items={items} />

      {/* Feedback de Importación */}
      <InventoryFeedback message={importMessage} status={importStatus} />

      {/* Toolbar Modular */}
      <InventoryToolbar
        importStatus={importStatus}
        itemsCount={items.length}
        onExport={exportCSV}
        onImport={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportCSV(file);
        }}
        onCreate={openCreate}
        fileInputRef={fileInputRef}
      />

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">Contando existencias...</p>
        </div>
      ) : (
        <>
          {/* Vistas Mobile y Desktop */}
          <InventoryMobileList 
            items={items} 
            deleteId={deleteId} 
            onEdit={openEdit} 
            onDelete={deleteItem} 
          />
          <InventoryTable 
            items={items} 
            deleteId={deleteId} 
            onEdit={openEdit} 
            onDelete={deleteItem} 
          />
        </>
      )}

      {/* Modal de Creación/Edición */}
      <InventoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        form={form}
        setForm={setForm}
        saving={saving}
        onSave={saveItem}
        units={UNITS}
      />
    </LocalShell>
  );
}
