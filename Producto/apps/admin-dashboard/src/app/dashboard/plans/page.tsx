"use client";

import React, { useState } from "react";
import DashboardShell from "../_components/DashboardShell";
import { Button, Input } from "@menu-bites/ui";
import { CheckCircle2, Building2, Zap, Rocket, AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import Modal from "../_components/Modal";

/**
 * Tipo para definir la estructura de un Plan de Suscripción.
 */
type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
  buttonVariant: "default" | "outline";
  popular?: boolean;
};

/**
 * Estado inicial para el formulario de creación/edición.
 */
const emptyForm = {
  name: "",
  price: "",
  period: "/mes",
  description: "",
  features: [] as string[],
  popular: false,
};

/**
 * Página de Gestión de Planes.
 * Permite administrar los niveles de suscripción del ecosistema.
 * Utiliza variables del tema dinámico para asegurar que el branding se herede correctamente.
 */
export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [confirmDeletePlan, setConfirmDeletePlan] = useState<Plan | null>(null);

  const [formData, setFormData] = useState(emptyForm);

  // Funciones para abrir modales de creación y edición
  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      period: plan.period || "/mes",
      description: plan.description,
      features: [...plan.features],
      popular: !!plan.popular,
    });
    setIsModalOpen(true);
  };

  /**
   * Carga la lista de planes desde la API.
   * Se asignan iconos y clases de color dinámicas basadas en el tema.
   */
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/plans");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al cargar planes");
      
      const mappedPlans = (json.data || []).map((p: any) => ({
        ...p,
        // Asignación de iconos representativos
        icon: p.name.toLowerCase().includes('enterprise') ? <Building2 className="w-6 h-6 text-primary" /> :
              p.name.toLowerCase().includes('pro') ? <Zap className="w-6 h-6 text-primary" /> :
              <Rocket className="w-6 h-6 text-primary" />,
        // El color del borde y fondo ahora usa variables semánticas
        color: p.popular ? "border-primary/50 bg-primary/10 relative" : "border-border bg-card/50",
        buttonVariant: p.popular ? "default" : "outline"
      }));
      
      setPlans(mappedPlans);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPlans();
  }, []);

  /**
   * Guarda o actualiza un plan.
   */
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price.trim()) return;
    try {
      setSaving(true);
      const url = editingPlan ? `/api/admin/plans/${editingPlan.id}` : "/api/admin/plans";
      const method = editingPlan ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          features: formData.features.filter(f => f.trim() !== ""),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al guardar");

      await fetchPlans();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Elimina un plan de forma permanente.
   */
  const handleDelete = async () => {
    if (!confirmDeletePlan) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/plans/${confirmDeletePlan.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al eliminar");
      setConfirmDeletePlan(null);
      await fetchPlans();
    } catch (err: any) {
      setError(err.message);
      setConfirmDeletePlan(null);
    } finally {
      setDeleting(false);
    }
  };

  // Funciones auxiliares para gestionar beneficios (features) dinámicamente
  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = [...formData.features];
    newFeatures.splice(index, 1);
    setFormData({ ...formData, features: newFeatures });
  };

  return (
    <DashboardShell title="Directorio" subtitle="Planes de Suscripción">
      {/* Cabecera con descripción y botón de acción principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <p className="text-muted-foreground max-w-xl text-sm">
          Gestiona los niveles de suscripción disponibles para las organizaciones en tiempo real.
          Los cambios se reflejarán instantáneamente en el portal de clientes.
        </p>
        <Button onClick={openCreateModal} className="font-bold h-11 px-6 rounded-2xl shadow-lg shadow-primary/20 shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Plan
        </Button>
      </div>

      {/* Manejo de errores */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Estado de carga */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Estado vacío */}
      {!loading && plans.length === 0 && (
        <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-xl">
          No hay planes creados. Crea el primero con el botón "Nuevo Plan".
        </div>
      )}

      {/* Grid de tarjetas de planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className={`rounded-xl border p-6 flex flex-col relative transition-all hover:shadow-xl hover:shadow-black/20 ${plan.color}`}>
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg">
                Más Popular
              </span>
            )}

            <div className="mb-4">
              {plan.icon}
            </div>

            <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
            <p className="text-sm text-muted-foreground mt-2 min-h-[40px]">{plan.description}</p>

            <div className="my-6">
              <span className="text-4xl font-bold text-foreground">{plan.price}</span>
              <span className="text-muted-foreground font-medium ml-1">{plan.period}</span>
            </div>

            {/* Lista de beneficios con iconos de validación */}
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* Acciones por plan */}
            <div className="flex gap-2">
              <Button
                onClick={() => openEditModal(plan)}
                variant={plan.buttonVariant}
                className="flex-1 font-bold"
              >
                Editar
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 text-destructive border-border bg-card hover:bg-destructive/10 hover:border-destructive/40"
                onClick={() => setConfirmDeletePlan(plan)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Creación / Edición */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !saving && setIsModalOpen(false)}
        title={editingPlan ? "Editar Plan" : "Nuevo Plan"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim() || !formData.price.trim()} className="px-8">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : editingPlan ? "Guardar cambios" : "Crear Plan"}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nombre del Plan</label>
              <Input
                className="bg-background border-border"
                placeholder="ej. Starter"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Precio</label>
              <Input
                className="bg-background border-border"
                placeholder="ej. $29.990"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Período</label>
              <Input
                className="bg-background border-border"
                placeholder="ej. /mes"
                value={formData.period}
                onChange={(e) => setFormData((prev) => ({ ...prev, period: e.target.value }))}
              />
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-primary bg-background border-border"
                  checked={formData.popular}
                  onChange={(e) => setFormData((prev) => ({ ...prev, popular: e.target.checked }))}
                />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Marcar como Popular</span>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Descripción</label>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Describe brevemente este plan..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Beneficios Incluidos</label>
            {formData.features.map((feature, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  className="bg-background border-border flex-1"
                  placeholder={`Beneficio ${i + 1}`}
                  value={feature}
                  onChange={(e) => updateFeature(i, e.target.value)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-destructive border-border bg-background hover:bg-destructive/10"
                  onClick={() => removeFeature(i)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full border-border bg-background text-muted-foreground hover:text-foreground"
              onClick={addFeature}
            >
              <Plus className="w-4 h-4 mr-2" /> Agregar beneficio
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        isOpen={!!confirmDeletePlan}
        onClose={() => !deleting && setConfirmDeletePlan(null)}
        title="Eliminar Plan"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDeletePlan(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button onClick={handleDelete} disabled={deleting} variant="destructive">
              {deleting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Eliminando...</> : "Eliminar"}
            </Button>
          </>
        }
      >
        <p className="text-muted-foreground text-sm">
          ¿Estás seguro de que quieres eliminar el plan <span className="font-bold text-foreground">{confirmDeletePlan?.name}</span>? Esta acción no se puede deshacer y afectará a nuevas suscripciones.
        </p>
      </Modal>
    </DashboardShell>
  );
}
