"use client";

import React, { useCallback, useEffect, useState } from "react";
import LocalShell from "../_components/LocalShell";
import { Table, TableRow, TableCell } from "../_components/Table";
import Modal from "../_components/Modal";
import { Badge } from "../_components/Badge";
import { formatDate, LOCAL_ROLES, LocalUserRecord } from "../_components/localShared";
import { Button, Input } from "@menu-bites/ui";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react";

type BadgeVariant = "success" | "danger" | "warning" | "neutral" | "info";

function roleVariant(role: string): BadgeVariant {
  if (role === "ADMIN") return "info";
  if (role === "COCINA") return "warning";
  if (role === "CAJERO") return "success";
  if (role === "GARZON") return "neutral";
  return "neutral";
}

const EMPTY_FORM = { email: "", password: "", role: "GARZON" };

export default function UsersPage() {
  const [users, setUsers] = useState<LocalUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<LocalUserRecord | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
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

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEdit = (user: LocalUserRecord) => {
    setEditingUser(user);
    setForm({ email: user.email, password: "", role: user.role });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.email.trim()) return;
    if (!editingUser && !form.password.trim()) {
      setError("La contraseña es obligatoria para usuarios nuevos");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, string> = { email: form.email, role: form.role };
      if (form.password) payload.password = form.password;

      const res = editingUser
        ? await fetch(`/api/local/users/${editingUser.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/local/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error guardando usuario");
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar usuario de forma permanente?")) return;
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

  return (
    <LocalShell title="Gestión" subtitle="Usuarios">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Usuario
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
      ) : (
        <Table headers={["Correo", "Rol", "Creado", "Acciones"]}>
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No hay usuarios registrados. Crea el primero.
              </TableCell>
            </TableRow>
          )}
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <p className="font-medium text-slate-200">{user.email}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{user.id}</p>
              </TableCell>
              <TableCell>
                <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
              </TableCell>
              <TableCell className="text-slate-400 text-xs">
                {formatDate(user.createdAt)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(user)}
                    className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={deleteId === user.id}
                    className="p-1.5 rounded hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    {deleteId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
        title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingUser ? "Guardar cambios" : "Crear Usuario"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Correo electrónico <span className="text-red-400">*</span>
            </label>
            <Input
              type="email"
              placeholder="usuario@restaurante.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Contraseña {editingUser ? "(dejar en blanco para no cambiar)" : <span className="text-red-400">*</span>}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={editingUser ? "••••••••" : "Mínimo 6 caracteres"}
                className="pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {LOCAL_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500">
              El usuario quedará asociado automáticamente a este restaurante.
            </p>
          </div>
        </div>
      </Modal>
    </LocalShell>
  );
}
