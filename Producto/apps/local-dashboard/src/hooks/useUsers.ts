/**
 * useUsers — Hook de gestión de usuarios del restaurante.
 * Permite al ADMIN crear, editar y eliminar cuentas de su equipo via /api/local/users.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { LocalUserRecord, LOCAL_ROLES } from "@/app/[slug]/dashboard/_components/localShared";

const EMPTY_FORM = { email: "", password: "", role: "GARZON" };

/**
 * Los errores de guardado se relanzán (throw) para que el componente los capture en el modal.
 * La contraseña es obligatoria en creación y opcional en edición.
 */
export function useUsers() {
  const [users, setUsers] = useState<LocalUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<LocalUserRecord | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/local/users", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error cargando usuarios");
      setUsers(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (user: LocalUserRecord) => {
    setEditingUser(user);
    setForm({ email: user.email, password: "", role: user.role });
    setIsModalOpen(true);
  };

  const saveUser = async () => {
    if (!form.email.trim()) return;
    if (!editingUser && !form.password.trim()) {
      throw new Error("La contraseña es obligatoria para usuarios nuevos");
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, string> = { email: form.email, role: form.role };
      if (form.password) payload.password = form.password;

      const res = editingUser
        ? await fetch(`/api/local/users/${editingUser.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/local/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error guardando usuario");
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id: string) => {
    setDeleteId(id);
    try {
      const res = await fetch(`/api/local/users/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error eliminando usuario");
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setDeleteId(null);
    }
  };

  return {
    users,
    loading,
    error,
    setError,
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
    fetchUsers,
  };
}
