"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button, Input } from "@menu-bites/ui";
import { Eye, EyeOff, Pencil, Plus, Trash2, Search } from "lucide-react";
import DashboardShell from "../_components/DashboardShell";
import { formatDate, Restaurant, ROLES, UserRecord } from "../_components/adminShared";
import { Table, TableRow, TableCell } from "../_components/Table";
import { Badge } from "../_components/Badge";
import Modal from "../_components/Modal";

export default function UsersPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: "", password: "", role: "ADMIN", restaurantId: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [restaurantsRes, usersRes] = await Promise.all([
        fetch("/api/admin/restaurants", { cache: "no-store" }),
        fetch("/api/admin/users", { cache: "no-store" }),
      ]);

      const restaurantsJson = await restaurantsRes.json();
      const usersJson = await usersRes.json();

      if (!restaurantsRes.ok) throw new Error(restaurantsJson.error || "Error cargando restaurantes");
      if (!usersRes.ok) throw new Error(usersJson.error || "Error cargando usuarios");

      setRestaurants(restaurantsJson.data || []);
      setUsers(usersJson.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    setEditingUserId(null);
    setFormData({ email: "", password: "", role: "ADMIN", restaurantId: "" });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (userRow: UserRecord) => {
    setEditingUserId(userRow.id);
    setFormData({
      email: userRow.email,
      password: "",
      role: userRow.role,
      restaurantId: userRow.restaurant_id || "",
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.email.trim()) return;
    if (!editingUserId && !formData.password.trim()) {
      setError("La contraseña es requerida para usuarios nuevos");
      return;
    }

    const payload = {
      email: formData.email,
      password: formData.password || undefined,
      role: formData.role,
      restaurantId: formData.restaurantId || null,
    };

    const url = editingUserId ? `/api/admin/users/${editingUserId}` : "/api/admin/users";
    const method = editingUserId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "No se pudo guardar el usuario");
      return;
    }

    setIsModalOpen(false);
    await fetchData();
  };

  const deleteUser = async (id: string) => {
    const confirmed = window.confirm("¿Eliminar usuario de forma permanente?");
    if (!confirmed) return;

    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "No se pudo eliminar usuario");
      return;
    }

    await fetchData();
  };

  const getRoleVariant = (role: string) => {
    if (role === "SUPER_ADMIN") return "danger";
    if (role === "ADMIN") return "info";
    if (role === "CLIENTE") return "neutral";
    return "warning"; // GARZON, COCINA
  };

  return (
    <DashboardShell title="Directorio" subtitle="Usuarios Globales">
      {error && (
        <div className="p-4 rounded-md border border-red-500/30 bg-red-500/10 text-sm text-red-500 font-medium mb-6">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Buscar usuarios..." 
            className="pl-9 bg-slate-900 border-slate-800 text-sm focus-visible:ring-blue-500"
          />
        </div>
        <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Invitar Usuario
        </Button>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Cargando usuarios...</div>
      ) : (
        <Table headers={["Correo", "Rol", "Organización", "Creado", ""]}>
          {users.length === 0 && (
            <TableRow>
              <TableCell className="text-center text-slate-500" colSpan={5}>
                No se encontraron usuarios.
              </TableCell>
            </TableRow>
          )}
          {users.map((userRow) => {
            const restaurantName = Array.isArray(userRow.restaurants)
                ? userRow.restaurants[0]?.name
                : userRow.restaurants?.name;

            return (
              <TableRow key={userRow.id}>
                <TableCell>
                  <div className="font-medium text-slate-200">{userRow.email}</div>
                  <div className="text-[11px] text-slate-500">{userRow.id}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleVariant(userRow.role)}>
                    {userRow.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-300 text-sm">
                  {restaurantName ? (
                    <span className="font-medium">{restaurantName}</span>
                  ) : (
                    <span className="text-slate-500 italic">Acceso Global</span>
                  )}
                </TableCell>
                <TableCell className="text-slate-400 text-xs">
                  {formatDate(userRow.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                      onClick={() => openEditModal(userRow)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => deleteUser(userRow.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </Table>
      )}

      {/* Slide-over Modal for Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUserId ? "Editar Usuario" : "Invitar Usuario"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:bg-slate-800 hover:text-white">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              {editingUserId ? "Guardar cambios" : "Invitar"}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dirección de correo <span className="text-red-500">*</span></label>
            <Input 
              placeholder="e.g. jdoe@example.com" 
              className="bg-slate-950 border-slate-800"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Contraseña {editingUserId ? "(Opcional)" : <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={editingUserId ? "Dejar en blanco para mantener la actual" : "••••••••"}
                className="bg-slate-950 border-slate-800 pr-10"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol</label>
            <select
              className="w-full h-10 rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.role}
              onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organización</label>
            <select
              className="w-full h-10 rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.restaurantId}
              onChange={(e) => setFormData((prev) => ({ ...prev, restaurantId: e.target.value }))}
            >
              <option value="">-- Acceso Global (Sin Organización) --</option>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">Dejar en blanco si el usuario es un Super Administrador.</p>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}
