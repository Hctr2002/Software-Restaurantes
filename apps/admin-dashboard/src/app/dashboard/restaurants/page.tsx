"use client";

import React from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@menu-bites/ui";
import { Pencil, Plus, Save, Store, Trash2, X } from "lucide-react";
import DashboardShell from "../_components/DashboardShell";
import { formatDate, Restaurant, RESTAURANT_STATUSES } from "../_components/adminShared";

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [newRestaurant, setNewRestaurant] = React.useState({ name: "", slug: "", status: "ACTIVE" });
  const [editingRestaurantId, setEditingRestaurantId] = React.useState<string | null>(null);
  const [editingRestaurant, setEditingRestaurant] = React.useState({ name: "", slug: "", status: "ACTIVE" });

  const fetchRestaurants = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/restaurants", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Error cargando restaurantes");
      setRestaurants(json.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

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
    await fetchRestaurants();
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
    await fetchRestaurants();
  };

  const deleteRestaurant = async (id: string) => {
    const confirmed = window.confirm("Eliminar restaurante? Esta accion no se puede deshacer.");
    if (!confirmed) return;

    const res = await fetch(`/api/admin/restaurants/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "No se pudo eliminar restaurante");
      return;
    }

    await fetchRestaurants();
  };

  const restaurantsTop20 = restaurants.slice(0, 20);

  return (
    <DashboardShell title="Panel de Super Administrador" subtitle="Restaurantes">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold">
          {error}
        </div>
      )}

      <Card className="border-white/5 bg-white/5 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Store className="w-5 h-5" /> Restaurantes</CardTitle>
          <CardDescription>Listado de los ultimos 20 restaurantes con acciones por registro</CardDescription>
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

          <Button variant="premium" onClick={createRestaurant} className="w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Crear Nuevo Restaurante
          </Button>

          <div className="space-y-3 max-h-[620px] overflow-auto pr-1">
            {restaurantsTop20.map((restaurant) => {
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
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm">{restaurant.name}</p>
                        <p className="text-xs text-muted-foreground">slug: {restaurant.slug} | estado: {restaurant.status}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{formatDate(restaurant.createdAt)}</p>
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
                  )}
                </div>
              );
            })}
          </div>

          {loading && (
            <p className="text-sm text-muted-foreground">Cargando restaurantes...</p>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
