"use client";

import React, { useCallback, useEffect, useState } from "react";
import LocalShell from "../_components/LocalShell";
import { Table, TableRow, TableCell, Modal, Badge } from "@menu-bites/ui";
import { formatDate, LOCAL_ROLES, LocalUserRecord } from "../_components/localShared";
import { Button, Input } from "@menu-bites/ui";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

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
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold mb-6">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-8">
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold h-11 px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Usuario
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">Sincronizando equipo...</p>
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {users.length === 0 && (
              <div className="py-12 text-center glass rounded-[2.5rem] border-white/5 text-foreground/40 font-bold uppercase tracking-widest text-[10px]">
                No hay usuarios registrados.
              </div>
            )}
            {users.map((user) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={user.id}
                className="glass p-6 rounded-[2rem] border-white/5 space-y-4 relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div className="overflow-hidden">
                    <h3 className="font-black text-foreground text-base tracking-tight truncate leading-tight mb-1">{user.email}</h3>
                    <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest truncate">{user.id}</p>
                  </div>
                  <Badge variant={roleVariant(user.role)} className="px-3 py-1 text-[9px] font-black">
                    {user.role}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-[10px] font-bold pt-2">
                  <span className="text-foreground/30 uppercase tracking-widest">Creado</span>
                  <span className="text-foreground/60">{formatDate(user.createdAt)}</span>
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-2">
                  <Button 
                    className="flex-1 bg-white/5 hover:bg-primary/10 hover:text-primary border-white/5 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest transition-all"
                    onClick={() => openEdit(user)}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                  </Button>
                  <Button 
                    variant="ghost"
                    className="aspect-square p-0 bg-white/5 hover:bg-destructive/10 hover:text-destructive border-white/5 rounded-xl h-10 w-10 transition-all"
                    onClick={() => handleDelete(user.id)}
                    disabled={deleteId === user.id}
                  >
                    {deleteId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block">
            <Table headers={["Correo", "Rol", "Creado", "Acciones"]}>
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-foreground/40 py-12 font-bold uppercase tracking-widest text-xs">
                    No hay usuarios registrados. Crea el primero.
                  </TableCell>
                </TableRow>
              )}
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-black text-foreground text-sm tracking-tight">{user.email}</div>
                    <div className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">{user.id}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleVariant(user.role)} className="px-4 py-1 text-[10px] font-black">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground/40 text-[11px] font-bold">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-foreground/40 hover:text-primary hover:bg-primary/10 transition-all"
                        onClick={() => openEdit(user)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                        onClick={() => handleDelete(user.id)}
                        disabled={deleteId === user.id}
                      >
                        {deleteId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-foreground/50 hover:bg-white/5 hover:text-foreground rounded-xl font-bold uppercase tracking-widest text-[10px]">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-primary/20 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingUser ? "Guardar cambios" : "Crear Usuario"}
            </Button>
          </>
        }
      >
        <div className="space-y-8 py-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">
              Correo electrónico <span className="text-destructive">*</span>
            </label>
            <Input
              type="email"
              placeholder="usuario@restaurante.com"
              className="bg-white/5 border-white/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-medium"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">
              Contraseña {editingUser ? "(dejar en blanco para no cambiar)" : <span className="text-destructive">*</span>}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={editingUser ? "••••••••" : "Mínimo 6 caracteres"}
                className="bg-white/5 border-white/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-medium pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-primary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">Rol</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
            >
              {LOCAL_ROLES.map((r) => (
                <option key={r} value={r} className="bg-background">{r}</option>
              ))}
            </select>
            <p className="text-[9px] text-foreground/20 font-bold uppercase tracking-wider px-1">
              El usuario quedará asociado automáticamente a este restaurante.
            </p>
          </div>
        </div>
      </Modal>
    </LocalShell>
  );
}
