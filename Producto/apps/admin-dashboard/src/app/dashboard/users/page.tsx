"use client";

/**
 * UsersPage: Gestión centralizada de identidades y accesos del ecosistema.
 * 
 * Este componente permite el aprovisionamiento de usuarios, asignación de roles
 * y vinculación con organizaciones específicas. Implementa un flujo de trabajo
 * seguro con validaciones en tiempo real y herencia de marca dinámica.
 * 
 * Estándares:
 * - Clean Code: Lógica de negocio encapsulada y estados predecibles.
 * - Branding: Uso de tokens semánticos (primary, foreground, border-border).
 * - UI/UX: Modales con diseño sólido premium y transiciones fluidas.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Button, Input } from "@menu-bites/ui";
import { Eye, EyeOff, Pencil, Plus, Trash2, Search, UserPlus, Users, Fingerprint } from "lucide-react";
import DashboardShell from "../_components/DashboardShell";
import { formatDate, Restaurant, ROLES, UserRecord } from "../_components/adminShared";
import { Table, TableRow, TableCell } from "../_components/Table";
import { Badge } from "../_components/Badge";
import Modal from "../_components/Modal";
import { motion, AnimatePresence } from "framer-motion";

export default function UsersPage() {
  // --- Estado de Aplicación ---
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Estado de UI (Modales y Formularios) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    email: "", 
    password: "", 
    role: "ADMIN", 
    restaurantId: "" 
  });

  /**
   * fetchData: Sincroniza el estado local con la persistencia centralizada.
   * Utiliza Promise.all para optimizar el tiempo de carga inicial.
   */
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

      if (!restaurantsRes.ok) throw new Error(restaurantsJson.error || "Error cargando organizaciones");
      if (!usersRes.ok) throw new Error(usersJson.error || "Error cargando usuarios");

      setRestaurants(restaurantsJson.data || []);
      setUsers(usersJson.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado de red";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handlers de Operación ---

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
      setError("La integridad del sistema requiere una contraseña para nuevos usuarios.");
      return;
    }

    const payload = {
      email: formData.email,
      password: formData.password || undefined,
      role: formData.role,
      restaurantId: formData.restaurantId || null,
    };

    try {
      const url = editingUserId ? `/api/admin/users/${editingUserId}` : "/api/admin/users";
      const method = editingUserId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fallo en la persistencia del usuario");

      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteUser = async (id: string) => {
    const confirmed = window.confirm("¿Confirma la revocación permanente de este acceso?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo completar la eliminación");
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  /**
   * getRoleVariant: Mapea roles de negocio a variantes visuales semánticas.
   */
  const getRoleVariant = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "danger";
      case "ADMIN": return "info";
      case "CLIENTE": return "neutral";
      case "BAR": return "info";
      default: return "warning";
    }
  };

  // Filtrado reactivo de usuarios
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardShell title="Directorio" subtitle="Control de Identidades y Privilegios">
      {/* Notificación de Error Estilizada */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 rounded-2xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-black mb-6 flex items-center gap-3"
          >
            <div className="p-1 bg-destructive/20 rounded-lg">
              <Trash2 className="w-4 h-4" />
            </div>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra de Herramientas Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Filtrar por correo o rol..." 
            className="pl-11 bg-muted/30 border-border text-sm h-12 rounded-2xl focus-visible:ring-primary/50 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button 
          onClick={openCreateModal} 
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-xl shadow-primary/20 h-12 px-6 rounded-2xl transition-all hover:scale-105 active:scale-95"
        >
          <UserPlus className="w-4 h-4 mr-2" /> 
          Invitar Usuario
        </Button>
      </div>

      {/* Tabla de Datos con Diseño Sólido Premium */}
      <div className="rounded-[2.5rem] border border-border bg-card overflow-hidden shadow-2xl shadow-black/5">
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Sincronizando Identidades...</p>
            </div>
          </div>
        ) : (
          <Table headers={["Identidad", "Rol de Acceso", "Organización", "Sincronizado", "Acciones"]}>
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell className="text-center text-muted-foreground italic py-12" colSpan={5}>
                  No se encontraron registros coincidentes.
                </TableCell>
              </TableRow>
            )}
            {filteredUsers.map((userRow) => {
              const restaurantName = Array.isArray(userRow.restaurants)
                  ? userRow.restaurants[0]?.name
                  : userRow.restaurants?.name;

              return (
                <TableRow key={userRow.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs shadow-inner">
                        {userRow.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-foreground text-sm tracking-tight">{userRow.email}</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1 mt-0.5">
                          <Fingerprint className="w-2.5 h-2.5 opacity-50" />
                          {userRow.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleVariant(userRow.role)} className="font-black tracking-tighter scale-90 origin-left">
                      {userRow.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground/80 text-sm">
                    {restaurantName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="font-bold tracking-tight">{restaurantName}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50 italic font-medium uppercase text-[10px] tracking-widest">Global Master</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
                    {formatDate(userRow.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                        onClick={() => openEditModal(userRow)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
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
      </div>

      {/* Modal de Gestión con Estética Coherente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUserId ? "Modificar Credenciales" : "Alta de Nuevo Usuario"}
        footer={
          <div className="flex gap-3 w-full justify-end pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold text-muted-foreground hover:bg-muted/50">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-8 rounded-xl shadow-lg shadow-primary/20">
              {editingUserId ? "Confirmar Cambios" : "Ejecutar Alta"}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 pt-2">
          {/* Campo: Correo Electrónico */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Identidad Digital</label>
            <Input 
              placeholder="usuario@menubites.cl" 
              className="bg-muted/30 border-border rounded-xl h-12 font-medium focus:ring-primary/30"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>

          {/* Campo: Contraseña con Toggle de Visibilidad */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
              Clave de Acceso {editingUserId && <span className="text-primary/50">(Opcional)</span>}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={editingUserId ? "Sin cambios..." : "••••••••"}
                className="bg-muted/30 border-border rounded-xl h-12 font-medium pr-12 focus:ring-primary/30"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Grid: Selección de Rol y Organización */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Nivel de Privilegio</label>
              <select
                className="w-full h-12 rounded-xl border border-border bg-muted/30 px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/30 outline-none appearance-none"
                value={formData.role}
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role} className="bg-background text-foreground">{role}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Asignación de Marca</label>
              <select
                className="w-full h-12 rounded-xl border border-border bg-muted/30 px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/30 outline-none appearance-none"
                value={formData.restaurantId}
                onChange={(e) => setFormData((prev) => ({ ...prev, restaurantId: e.target.value }))}
              >
                <option value="" className="bg-background text-foreground italic">Acceso Maestro Global</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id} className="bg-background text-foreground">{restaurant.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <p className="text-[10px] text-muted-foreground/60 font-bold italic text-center pt-2">
            * Los cambios en privilegios impactan inmediatamente en la sesión del usuario.
          </p>
        </div>
      </Modal>
    </DashboardShell>
  );
}
