"use client";

import React from "react";
import LocalShell from "../_components/LocalShell";
import { useUsers } from "@/hooks/useUsers";
import { UserToolbar } from "./_components/UserToolbar";
import { UserTable } from "./_components/UserTable";
import { UserMobileList } from "./_components/UserMobileList";
import { UserModal } from "./_components/UserModal";

export default function UsersPage() {
  const {
    users,
    loading,
    error,
    isModalOpen,
    setIsModalOpen,
    editingUser,
    form,
    setForm,
    saving,
    deleteId,
    openCreate,
    openEdit,
    saveUser,
    deleteUser,
  } = useUsers();

  return (
    <LocalShell title="Gestión" subtitle="Usuarios">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold mb-6">
          {error}
        </div>
      )}

      <UserToolbar onAdd={openCreate} />

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">Sincronizando equipo...</p>
        </div>
      ) : (
        <>
          <UserMobileList 
            users={users} 
            onEdit={openEdit} 
            onDelete={deleteUser} 
            deleteId={deleteId} 
          />
          <UserTable 
            users={users} 
            onEdit={openEdit} 
            onDelete={deleteUser} 
            deleteId={deleteId} 
          />
        </>
      )}

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingUser={editingUser}
        form={form}
        setForm={setForm}
        onSave={saveUser}
        saving={saving}
      />
    </LocalShell>
  );
}
