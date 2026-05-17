"use client";

/**
 * @file RestaurantsPage.tsx
 * @description Directorio maestro de organizaciones (restaurantes) del ecosistema.
 * @version 2.1.0
 * 
 * Este componente implementa la gestión centralizada de las marcas (tenants) registradas.
 * Se rige por los principios de:
 * - Clean Code: Separación de estados de UI y persistencia de datos.
 * - Glassmorphism: Estética premium con transparencias y desenfoques.
 * - UX de Alta Resolución: Feedback instantáneo, búsqueda reactiva y animaciones fluidas.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Input } from "@menu-bites/ui";
import { Pencil, Plus, Trash2, Search, MoreHorizontal, X, LayoutGrid, List } from "lucide-react";
import DashboardShell from "../_components/DashboardShell";
import { formatDate, Restaurant, RESTAURANT_STATUSES } from "../_components/adminShared";
import { Table, TableRow, TableCell } from "../_components/Table";
import { Badge } from "../_components/Badge";
import Modal from "../_components/Modal";
import { motion, AnimatePresence } from "framer-motion";

export default function RestaurantsPage() {
  // --- Estados de Datos y Sincronización ---
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Estados de Gestión (Modales / Formularios) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<{id: string, name: string}[]>([]);
  const [formData, setFormData] = useState({ name: "", slug: "", status: "ACTIVE", planId: "" });

  /**
   * fetchRestaurants: Sincroniza la lista maestra de organizaciones.
   */
  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/restaurants", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error cargando restaurantes");
      setRestaurants(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * fetchPlans: Obtiene los planes disponibles para su asignación.
   */
  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/plans");
      const json = await res.json();
      if (res.ok) setAvailablePlans(json.data || []);
    } catch (e) {
      console.error("No se pudieron cargar los planes", e);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    fetchPlans();
  }, [fetchRestaurants]);

  // --- Lógica de Búsqueda Reactiva ---
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [restaurants, searchQuery]);

  // --- Handlers de Interfaz ---
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
    setIsSaving(true);
    setError(null);

    const url = editingRestaurantId ? `/api/admin/restaurants/${editingRestaurantId}` : "/api/admin/restaurants";
    const method = editingRestaurantId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al procesar la solicitud");

      setIsModalOpen(false);
      await fetchRestaurants();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRestaurant = async (id: string) => {
    if (!window.confirm("¿Confirmar eliminación? Se perderán todos los datos vinculados.")) return;
    
    try {
      const res = await fetch(`/api/admin/restaurants/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Error al eliminar");
      }
      await fetchRestaurants();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar registro");
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ACTIVE": return "success";
      case "SUSPENDED": return "danger";
      default: return "neutral";
    }
  };

  return (
    <DashboardShell title="Directorio" subtitle="Organizaciones">
      {/* Notificaciones de Error con AnimatePresence */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-2xl border border-destructive/20 bg-destructive/10 text-sm text-destructive font-bold flex justify-between items-center">
              <span className="flex items-center gap-2">
                <X className="w-4 h-4 cursor-pointer" onClick={() => setError(null)} />
                {error}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar Premium */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por nombre, slug o ID..." 
            className="pl-11 bg-card border border-border text-sm focus-visible:ring-primary h-12 rounded-2xl text-foreground transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button 
          onClick={openCreateModal} 
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12 px-8 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" /> Nueva Marca
        </Button>
      </div>

      {/* Contenedor Principal de Datos */}
      {loading ? (
        <div className="py-32 text-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full mx-auto mb-6"
          />
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">Sincronizando Nucleus...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Vista Móvil (Tarjetas) */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            <AnimatePresence mode="popLayout">
              {filteredRestaurants.map((restaurant, idx) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  key={restaurant.id}
                  className="bg-card p-6 rounded-[2.5rem] border border-border space-y-4 relative overflow-hidden group shadow-2xl shadow-black/5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-foreground text-xl tracking-tight leading-none mb-1">{restaurant.name}</h3>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{restaurant.slug}</p>
                    </div>
                    <Badge variant={getStatusVariant(restaurant.status)} className="text-[9px] font-black px-4 py-1 uppercase tracking-tighter">
                      {restaurant.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs font-bold bg-muted p-4 rounded-3xl">
                    <div className="space-y-1">
                      <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-black">Suscripción</p>
                      <p className="text-foreground font-black uppercase tracking-widest text-[11px]">{restaurant.plans?.name || "Básico"}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-black">Alta de Sistema</p>
                      <p className="text-muted-foreground/80">{formatDate(restaurant.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      className="flex-1 bg-foreground/5 hover:bg-primary/10 hover:text-primary border-foreground/5 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest transition-all text-foreground"
                      onClick={() => openEditModal(restaurant)}
                    >
                      <Pencil className="w-4 h-4 mr-2" /> Gestionar
                    </Button>
                    <Button 
                      variant="ghost"
                      className="aspect-square p-0 bg-foreground/5 hover:bg-destructive/10 hover:text-destructive border-foreground/5 rounded-2xl h-12 w-12 transition-all text-muted-foreground"
                      onClick={() => deleteRestaurant(restaurant.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredRestaurants.length === 0 && (
              <div className="py-20 text-center glass-premium rounded-[2.5rem] border-foreground/5 text-muted-foreground font-black uppercase tracking-widest text-[10px]">
                Sin coincidencias en el registro
              </div>
            )}
          </div>

          {/* Vista Escritorio (Tabla) */}
          <div className="hidden lg:block bg-card rounded-[3rem] border border-border overflow-hidden shadow-2xl shadow-black/5">
            <Table headers={["Organización", "Identificadores", "Plan de Servicio", "Estado", "Registro", "Acciones"]}>
              <AnimatePresence mode="popLayout">
                {filteredRestaurants.map((restaurant) => (
                  <TableRow key={restaurant.id} className="hover:bg-muted transition-colors border-b border-border">
                    <TableCell>
                      <div className="font-black text-foreground text-sm tracking-tight">{restaurant.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-[11px] text-primary font-bold">{restaurant.slug}</div>
                      <div className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em]">{restaurant.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-[10px] font-black text-foreground uppercase tracking-[0.1em] bg-foreground/5 px-3 py-1.5 rounded-xl inline-flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        {restaurant.plans?.name || "Standard"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(restaurant.status)} className="text-[9px] font-black px-4 py-1 uppercase tracking-tighter">
                        {restaurant.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                      {formatDate(restaurant.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-3">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-11 w-11 rounded-2xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                          onClick={() => openEditModal(restaurant)}
                        >
                          <Pencil className="w-5 h-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-11 w-11 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all border border-transparent hover:border-destructive/20"
                          onClick={() => deleteRestaurant(restaurant.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </AnimatePresence>
            </Table>
            {filteredRestaurants.length === 0 && (
              <div className="py-20 text-center text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">
                No se encontraron registros activos bajo este criterio
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Configuración */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title={editingRestaurantId ? "Configuración de Marca" : "Nueva Alta de Sistema"}
        footer={
          <div className="flex gap-4 w-full justify-end mt-4">
            <Button 
              variant="ghost" 
              disabled={isSaving}
              onClick={() => setIsModalOpen(false)} 
              className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] px-8"
            >
              Cerrar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] px-10 shadow-xl shadow-primary/30 transition-all active:scale-95 min-w-[140px]"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                editingRestaurantId ? "Guardar" : "Confirmar"
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-8 py-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Nombre Comercial</label>
            <Input 
              disabled={isSaving}
              placeholder="e.g. Restaurante Gourmet" 
              className="bg-foreground/5 border-foreground/5 h-14 rounded-2xl focus-visible:ring-primary text-foreground font-bold text-base"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">URL Identificador (SLUG)</label>
            <Input 
              disabled={isSaving}
              placeholder="gourmet-express" 
              className="bg-foreground/5 border-foreground/5 h-14 rounded-2xl focus-visible:ring-primary font-mono text-sm text-primary font-black"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
            />
            <p className="text-[9px] text-muted-foreground/50 font-bold uppercase tracking-wider px-1">
              Este identificador es permanente y define la ruta de acceso al portal.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Estatus</label>
              <div className="relative">
                <select
                  disabled={isSaving}
                  className="w-full h-14 rounded-2xl border border-foreground/5 bg-foreground/5 px-5 text-sm text-foreground font-black focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                >
                  {RESTAURANT_STATUSES.map((status) => (
                    <option key={status} value={status} className="bg-background text-foreground">{status}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Nivel de Plan</label>
              <div className="relative">
                <select
                  disabled={isSaving}
                  className="w-full h-14 rounded-2xl border border-foreground/5 bg-foreground/5 px-5 text-sm text-foreground font-black focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                  value={formData.planId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, planId: e.target.value }))}
                >
                  <option value="" className="bg-background text-muted-foreground">Seleccionar...</option>
                  {availablePlans.map((plan) => (
                    <option key={plan.id} value={plan.id} className="bg-background text-foreground">{plan.name}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}
