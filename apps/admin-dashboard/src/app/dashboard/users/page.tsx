"use client";

import React from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@menu-bites/ui";
import { Eye, EyeOff, Pencil, Plus, Save, Trash2, Users, X } from "lucide-react";
import DashboardShell from "../_components/DashboardShell";
import { formatDate, Restaurant, ROLES, UserRecord } from "../_components/adminShared";

export default function UsersPage() {
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([]);
  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = React.useState(false);

  const [newUser, setNewUser] = React.useState({ email: "", password: "", role: "ADMIN", restaurantId: "" });
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [editingUser, setEditingUser] = React.useState({ email: "", password: "", role: "CLIENTE", restaurantId: "" });

  const fetchData = React.useCallback(async () => {
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

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createUser = async () => {
    if (!newUser.email.trim() || !newUser.password.trim()) return;

    const payload = {
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
      restaurantId: newUser.restaurantId || null,
    };

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "No se pudo crear usuario");
      return;
    }

    setNewUser({ email: "", password: "", role: "ADMIN", restaurantId: "" });
    await fetchData();
  };

  const updateUser = async (id: string) => {
    const payload = {
      email: editingUser.email,
      password: editingUser.password || undefined,
      role: editingUser.role,
      restaurantId: editingUser.restaurantId || null,
    };

    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "No se pudo actualizar usuario");
      return;
    }

    setEditingUserId(null);
    setEditingUser({ email: "", password: "", role: "CLIENTE", restaurantId: "" });
    await fetchData();
  };

  const deleteUser = async (id: string) => {
    const confirmed = window.confirm("Eliminar usuario de forma permanente?");
    if (!confirmed) return;

    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "No se pudo eliminar usuario");
      return;
    }

    await fetchData();
  };

  const usersTop20 = users.slice(0, 20);

  return (
    <DashboardShell title="Panel de Super Administrador" subtitle="Usuarios">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold">
          {error}
        </div>
      )}

      <Card className="border-white/5 bg-white/5 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Usuarios</CardTitle>
          <CardDescription>Listado de los ultimos 20 usuarios con opciones por registro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Email" value={newUser.email} onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))} />
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder="Password"
                className="pr-10"
                value={newUser.password}
                onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? "Ocultar password" : "Mostrar password"}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <select
              className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm"
              value={newUser.role}
              onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
            >
              {ROLES.map((role) => (
                <option key={role} value={role} className="bg-slate-900">{role}</option>
              ))}
            </select>
            <select
              className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm"
              value={newUser.restaurantId}
              onChange={(e) => setNewUser((prev) => ({ ...prev, restaurantId: e.target.value }))}
            >
              <option value="" className="bg-slate-900">Sin restaurante</option>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id} className="bg-slate-900">{restaurant.name}</option>
              ))}
            </select>
          </div>

          <Button variant="premium" onClick={createUser} className="w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Crear Nuevo Usuario
          </Button>

          <div className="space-y-3 max-h-[620px] overflow-auto pr-1">
            {usersTop20.map((userRow) => {
              const isEditing = editingUserId === userRow.id;
              const restaurantName = Array.isArray(userRow.restaurants)
                ? userRow.restaurants[0]?.name
                : userRow.restaurants?.name;

              return (
                <div key={userRow.id} className="p-3 rounded-xl border border-white/10 bg-black/20 space-y-2">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Input value={editingUser.email} onChange={(e) => setEditingUser((prev) => ({ ...prev, email: e.target.value }))} />
                        <Input type="password" placeholder="Nueva password (opcional)" value={editingUser.password} onChange={(e) => setEditingUser((prev) => ({ ...prev, password: e.target.value }))} />
                        <select
                          className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm"
                          value={editingUser.role}
                          onChange={(e) => setEditingUser((prev) => ({ ...prev, role: e.target.value }))}
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role} className="bg-slate-900">{role}</option>
                          ))}
                        </select>
                        <select
                          className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm"
                          value={editingUser.restaurantId}
                          onChange={(e) => setEditingUser((prev) => ({ ...prev, restaurantId: e.target.value }))}
                        >
                          <option value="" className="bg-slate-900">Sin restaurante</option>
                          {restaurants.map((restaurant) => (
                            <option key={restaurant.id} value={restaurant.id} className="bg-slate-900">{restaurant.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="premium" onClick={() => updateUser(userRow.id)}><Save className="w-4 h-4 mr-1" />Guardar</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingUserId(null)}><X className="w-4 h-4 mr-1" />Cancelar</Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm">{userRow.email}</p>
                        <p className="text-xs text-muted-foreground">rol: {userRow.role} | restaurante: {restaurantName || "Sin asignar"}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{formatDate(userRow.createdAt)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            setEditingUserId(userRow.id);
                            setEditingUser({
                              email: userRow.email,
                              password: "",
                              role: userRow.role,
                              restaurantId: userRow.restaurant_id || "",
                            });
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => deleteUser(userRow.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {loading && (
            <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
