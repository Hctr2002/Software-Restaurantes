"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button, Input } from "@menu-bites/ui";
import { Pencil, Plus, Trash2, Search, MoreHorizontal } from "lucide-react";
import DashboardShell from "../_components/DashboardShell";
import { formatDate, Restaurant, RESTAURANT_STATUSES } from "../_components/adminShared";
import { Table, TableRow, TableCell } from "../_components/Table";
import { Badge } from "../_components/Badge";
import Modal from "../_components/Modal";
import { motion } from "framer-motion";

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
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Buscar organizaciones..." 
            className="pl-9 bg-white/5 border-white/10 text-sm focus-visible:ring-primary h-11 rounded-2xl"
          />
        </div>
        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/80 text-white font-bold h-11 px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all duration-300 active:scale-95">
          <Plus className="w-4 h-4 mr-2" /> Crear Organización
        </Button>
      </div>

      {/* Data Section */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Sincronizando organizaciones...</p>
        </div>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {restaurants.length === 0 && (
              <div className="py-12 text-center glass-premium rounded-[2.5rem] border-white/5 text-slate-500 font-medium">
                No se encontraron organizaciones.
              </div>
            )}
            {restaurants.map((restaurant) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={restaurant.id}
                className="glass-premium p-6 rounded-[2rem] border-white/5 space-y-4 relative overflow-hidden group"
              >
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h3 className="font-black text-white text-lg tracking-tight leading-none mb-1">{restaurant.name}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{restaurant.slug}</p>
                  </div>
                  <Badge variant={getStatusVariant(restaurant.status)} className="text-[9px] font-black px-3">
                    {restaurant.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-xs font-bold relative z-10">
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider">Plan</p>
                    <p className="text-primary">{restaurant.plans?.name || "Sin Plan"}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider">Registro</p>
                    <p className="text-slate-400">{formatDate(restaurant.createdAt)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-2 relative z-10">
                  <Button 
                    className="flex-1 bg-white/5 hover:bg-primary/10 hover:text-primary border-white/5 rounded-xl h-10 text-xs font-bold uppercase tracking-widest transition-all"
                    onClick={() => openEditModal(restaurant)}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                  </Button>
                  <Button 
                    variant="ghost"
                    className="aspect-square p-0 bg-white/5 hover:bg-destructive/10 hover:text-destructive border-white/5 rounded-xl h-10 w-10 transition-all"
                    onClick={() => deleteRestaurant(restaurant.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden lg:block">
            <Table headers={["Nombre", "Slug", "Plan", "Estado", "Creado", ""]}>
              {restaurants.length === 0 && (
                <TableRow>
                  <TableCell className="text-center text-slate-500" colSpan={6}>
                    No se encontraron organizaciones.
                  </TableCell>
                </TableRow>
              )}
              {restaurants.map((restaurant) => (
                <TableRow key={restaurant.id}>
                  <TableCell>
                    <div className="font-black text-white text-sm tracking-tight">{restaurant.name}</div>
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{restaurant.id}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">
                    {restaurant.slug}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-black text-primary uppercase tracking-widest">
                      {restaurant.plans?.name || "Sin Plan"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(restaurant.status)} className="text-[10px] font-black px-3">
                      {restaurant.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-[11px] font-bold">
                    {formatDate(restaurant.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"
                        onClick={() => openEditModal(restaurant)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-slate-400 hover:text-destructive hover:bg-destructive/10 transition-all"
                        onClick={() => deleteRestaurant(restaurant.id)}
                      >
                        <Trash2 className="w-4 h-4" />
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
        title={editingRestaurantId ? "Editar Organización" : "Crear Organización"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:bg-white/5 hover:text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/80 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-primary/20">
              {editingRestaurantId ? "Guardar cambios" : "Crear"}
            </Button>
          </>
        }
      >
        <div className="space-y-8 py-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Nombre de la Organización</label>
            <Input 
              placeholder="e.g. Menu Bites Global" 
              className="bg-white/5 border-white/10 h-12 rounded-2xl focus-visible:ring-primary text-white font-medium"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Identificador (Slug)</label>
            <Input 
              placeholder="e.g. menu-bites" 
              className="bg-white/5 border-white/10 h-12 rounded-2xl focus-visible:ring-primary font-mono text-sm text-primary"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
            />
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider px-1">Identificador único para URLs y llamadas a la API.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Estado</label>
              <select
                className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
              >
                {RESTAURANT_STATUSES.map((status) => (
                  <option key={status} value={status} className="bg-navy-dark">{status}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Plan</label>
              <select
                className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                value={formData.planId}
                onChange={(e) => setFormData((prev) => ({ ...prev, planId: e.target.value }))}
              >
                <option value="" className="bg-navy-dark">Seleccionar...</option>
                {availablePlans.map((plan) => (
                  <option key={plan.id} value={plan.id} className="bg-navy-dark">{plan.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}
