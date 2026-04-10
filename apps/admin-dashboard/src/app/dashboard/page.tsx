"use client";

import React from "react";
import { useAuthStore } from "@menu-bites/store";
import { signOut } from "@menu-bites/auth";
import { LayoutDashboard, Store, Users, LogOut, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from "@menu-bites/ui";
import { useRouter } from "next/navigation";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
};

type UserRecord = {
  id: string;
  email: string;
  role: string;
  restaurant_id: string | null;
  createdAt: string;
  restaurants?: { name: string } | { name: string }[] | null;
};

const ROLES = ["SUPER_ADMIN", "ADMIN", "GARZON", "COCINA", "CLIENTE"];
const RESTAURANT_STATUSES = ["ACTIVE", "SUSPENDED", "CANCELLED"];

export default function DashboardPage() {
  const { user, logout: clearAuth } = useAuthStore();
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([]);
  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [newRestaurant, setNewRestaurant] = React.useState({ name: "", slug: "", status: "ACTIVE" });
  const [editingRestaurantId, setEditingRestaurantId] = React.useState<string | null>(null);
  const [editingRestaurant, setEditingRestaurant] = React.useState({ name: "", slug: "", status: "ACTIVE" });

  const [newUser, setNewUser] = React.useState({ email: "", password: "", role: "ADMIN", restaurantId: "" });
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [editingUser, setEditingUser] = React.useState({ email: "", password: "", role: "CLIENTE", restaurantId: "" });

  const router = useRouter();

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

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      clearAuth();
      router.replace("/");
      router.refresh();
      setIsSigningOut(false);
    }
  };

  const createRestaurant = async () => {
    if (!newRestaurant.name.trim() || !newRestaurant.slug.trim()) return;

    const res = await fetch("/api/admin/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRestaurant),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "No se pudo crear restaurante");
      return;
    }

    setNewRestaurant({ name: "", slug: "", status: "ACTIVE" });
    await fetchData();
  };

  const updateRestaurant = async (id: string) => {
    const res = await fetch(`/api/admin/restaurants/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingRestaurant),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "No se pudo actualizar restaurante");
      return;
    }

    setEditingRestaurantId(null);
    await fetchData();
  };

  const deleteRestaurant = async (id: string) => {
    const confirmed = window.confirm("¿Eliminar restaurante? Esta acción no se puede deshacer.");
    if (!confirmed) return;

    const res = await fetch(`/api/admin/restaurants/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "No se pudo eliminar restaurante");
      return;
    }

    await fetchData();
  };

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

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-primary/30">
      <aside className="fixed left-0 top-0 h-full w-64 bg-black/40 border-r border-white/5 backdrop-blur-3xl z-50 hidden lg:block">
        <div className="p-8">
          <h2 className="text-2xl font-black tracking-tighter uppercase italic">
            Menu <span className="text-primary">Bites</span>
          </h2>
          <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold mt-1">
            Super Admin Console
          </p>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          <NavItem icon={<LayoutDashboard className="w-5 h-5 text-primary" />} label="Resumen" active />
          <NavItem icon={<Store className="w-5 h-5" />} label="Restaurantes" />
          <NavItem icon={<Users className="w-5 h-5" />} label="Usuarios" />
        </nav>

        <div className="absolute bottom-8 left-0 w-full px-6">
          <Button 
            variant="outline" 
            className="w-full border-white/5 bg-white/5 hover:bg-destructive/20 hover:text-destructive hover:border-destructive/20 transition-all rounded-2xl"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isSigningOut ? "Cerrando..." : "Cerrar Sesión"}
          </Button>
        </div>
      </aside>

      <main className="lg:pl-64 min-h-screen">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-xl sticky top-0 z-40">
          <h1 className="text-xl font-bold tracking-tight">Panel de Super Administrador <span className="text-muted-foreground font-normal">/ CRUD Global</span></h1>
          
          <div className="flex items-center space-x-4">
            <div className="h-10 w-48 bg-white/5 rounded-2xl border border-white/5 flex items-center px-3 space-x-3">
              <div className="w-6 h-6 bg-primary/20 rounded-md flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white leading-none">Super Admin</p>
                <p className="text-[8px] text-muted-foreground uppercase font-black truncate max-w-[100px]">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {error && (
            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-white/5 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Store className="w-5 h-5" /> CRUD Restaurantes</CardTitle>
                <CardDescription>Crear, editar y eliminar restaurantes del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input placeholder="Nombre" value={newRestaurant.name} onChange={(e) => setNewRestaurant((prev) => ({ ...prev, name: e.target.value }))} />
                  <Input placeholder="Slug" value={newRestaurant.slug} onChange={(e) => setNewRestaurant((prev) => ({ ...prev, slug: e.target.value }))} />
                  <select
                    className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm"
                    value={newRestaurant.status}
                    onChange={(e) => setNewRestaurant((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    {RESTAURANT_STATUSES.map((status) => (
                      <option key={status} value={status} className="bg-slate-900">{status}</option>
                    ))}
                  </select>
                </div>

                <Button variant="premium" onClick={createRestaurant} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> Crear Restaurante
                </Button>

                <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                  {restaurants.map((restaurant) => {
                    const isEditing = editingRestaurantId === restaurant.id;
                    return (
                      <div key={restaurant.id} className="p-3 rounded-xl border border-white/10 bg-black/20 space-y-2">
                        {isEditing ? (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <Input value={editingRestaurant.name} onChange={(e) => setEditingRestaurant((prev) => ({ ...prev, name: e.target.value }))} />
                              <Input value={editingRestaurant.slug} onChange={(e) => setEditingRestaurant((prev) => ({ ...prev, slug: e.target.value }))} />
                              <select
                                className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm"
                                value={editingRestaurant.status}
                                onChange={(e) => setEditingRestaurant((prev) => ({ ...prev, status: e.target.value }))}
                              >
                                {RESTAURANT_STATUSES.map((status) => (
                                  <option key={status} value={status} className="bg-slate-900">{status}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="premium" onClick={() => updateRestaurant(restaurant.id)}><Save className="w-4 h-4 mr-1" />Guardar</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingRestaurantId(null)}><X className="w-4 h-4 mr-1" />Cancelar</Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="font-bold text-sm">{restaurant.name}</p>
                                <p className="text-xs text-muted-foreground">slug: {restaurant.slug} | estado: {restaurant.status}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingRestaurantId(restaurant.id);
                                    setEditingRestaurant({ name: restaurant.name, slug: restaurant.slug, status: restaurant.status });
                                  }}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="destructive" onClick={() => deleteRestaurant(restaurant.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> CRUD Usuarios</CardTitle>
                <CardDescription>Gestiona usuarios globales y su asignación por restaurante</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input placeholder="Email" value={newUser.email} onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))} />
                  <Input type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))} />
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

                <Button variant="premium" onClick={createUser} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> Crear Usuario
                </Button>

                <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                  {users.map((userRow) => {
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
              </CardContent>
            </Card>
          </div>

          {loading && (
            <p className="text-sm text-muted-foreground">Cargando datos de administración...</p>
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button 
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
        active 
          ? "bg-primary/10 text-primary border border-primary/20" 
          : "text-muted-foreground hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      <span className="text-sm font-bold tracking-tight">{label}</span>
    </button>
  );
}
