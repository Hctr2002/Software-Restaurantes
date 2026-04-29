"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button, Input } from "@menu-bites/ui";
import { Pencil, Plus, Trash2, Search, MoreHorizontal } from "lucide-react";
import DashboardShell from "../_components/DashboardShell";
import { formatDate, Restaurant, RESTAURANT_STATUSES } from "../_components/adminShared";
import { Table, TableRow, TableCell } from "../_components/Table";
import { Badge } from "../_components/Badge";
import Modal from "../_components/Modal";

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<{id: string, name: string}[]>([]);
  const [formData, setFormData] = useState({ name: "", slug: "", status: "ACTIVE", planId: "" });

  const fetchRestaurants = useCallback(async () => {
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

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/plans");
      const json = await res.json();
      if (res.ok) setAvailablePlans(json.data || []);
    } catch (e) {
      console.error("Error cargando planes", e);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    fetchPlans();
  }, [fetchRestaurants]);

  const openCreateModal = () => {
    setEditingRestaurantId(null);
    setFormData({ name: "", slug: "", status: "ACTIVE", planId: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (restaurant: Restaurant) => {
    setEditingRestaurantId(restaurant.id);
    setFormData({ 
      name: restaurant.name, 
      slug: restaurant.slug, 
      status: restaurant.status,
      planId: restaurant.plan_id || ""
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) return;

    const url = editingRestaurantId ? `/api/admin/restaurants/${editingRestaurantId}` : "/api/admin/restaurants";
    const method = editingRestaurantId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "No se pudo guardar la organización");
      setIsModalOpen(false);
      return;
    }

    setIsModalOpen(false);
    await fetchRestaurants();
  };

  const deleteRestaurant = async (id: string) => {
    const confirmed = window.confirm("¿Eliminar organización? Esta acción no se puede deshacer.");
    if (!confirmed) return;

    const res = await fetch(`/api/admin/restaurants/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "No se pudo eliminar la organización");
      return;
    }

    await fetchRestaurants();
  };

  const getStatusVariant = (status: string) => {
    if (status === "ACTIVE") return "success";
    if (status === "SUSPENDED") return "danger";
    return "neutral";
  };

  return (
    <DashboardShell title="Directorio" subtitle="Organizaciones">
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
            placeholder="Buscar organizaciones..." 
            className="pl-9 bg-slate-900 border-slate-800 text-sm focus-visible:ring-blue-500"
          />
        </div>
        <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Crear Organización
        </Button>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Cargando organizaciones...</div>
      ) : (
        <Table headers={["Nombre", "Identificador (Slug)", "Plan", "Estado", "Creado", ""]}>
          {restaurants.length === 0 && (
            <TableRow>
              <TableCell className="text-center text-slate-500" colSpan={5}>
                No se encontraron organizaciones.
              </TableCell>
            </TableRow>
          )}
          {restaurants.map((restaurant) => (
            <TableRow key={restaurant.id}>
              <TableCell>
                <div className="font-medium text-slate-200">{restaurant.name}</div>
                <div className="text-[11px] text-slate-500">{restaurant.id}</div>
              </TableCell>
              <TableCell className="font-mono text-xs text-slate-400">
                {restaurant.slug}
              </TableCell>
              <TableCell>
                <div className="text-sm font-medium text-purple-400">
                  {restaurant.plans?.name || "Sin Plan"}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(restaurant.status)}>
                  {restaurant.status}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-400 text-xs">
                {formatDate(restaurant.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                    onClick={() => openEditModal(restaurant)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    onClick={() => deleteRestaurant(restaurant.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* Slide-over Modal for Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRestaurantId ? "Editar Organización" : "Crear Organización"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:bg-slate-800 hover:text-white">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              {editingRestaurantId ? "Guardar cambios" : "Crear"}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre de la Organización <span className="text-red-500">*</span></label>
            <Input 
              placeholder="e.g. Menu Bites Global" 
              className="bg-slate-950 border-slate-800"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Identificador (Slug) <span className="text-red-500">*</span></label>
            <Input 
              placeholder="e.g. menu-bites" 
              className="bg-slate-950 border-slate-800 font-mono text-sm"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
            />
            <p className="text-[10px] text-slate-500">Identificador único para URLs y llamadas a la API.</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</label>
            <select
              className="w-full h-10 rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
            >
              {RESTAURANT_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan de Suscripción</label>
            <select
              className="w-full h-10 rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.planId}
              onChange={(e) => setFormData((prev) => ({ ...prev, planId: e.target.value }))}
            >
              <option value="">Seleccionar Plan...</option>
              {availablePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500">Define los límites y características disponibles para esta organización.</p>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}
