"use client";

import React, { useState } from "react";
import DashboardShell from "../_components/DashboardShell";
import { Button, Input } from "@menu-bites/ui";
import { CheckCircle2, Building2, Zap, Rocket, AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import Modal from "../_components/Modal";

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

const emptyForm = {
  name: "",
  price: "",
  period: "/mes",
  description: "",
  features: [] as string[],
  popular: false,
};

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

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/plans");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al cargar planes");
      
      const mappedPlans = (json.data || []).map((p: any) => ({
        ...p,
        icon: p.name.toLowerCase().includes('enterprise') ? <Building2 className="w-6 h-6 text-emerald-400" /> :
              p.name.toLowerCase().includes('pro') ? <Zap className="w-6 h-6 text-purple-400" /> :
              <Rocket className="w-6 h-6 text-blue-400" />,
        color: p.popular ? "border-purple-500/50 bg-purple-500/10 relative" : "border-slate-800 bg-slate-900/50",
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <p className="text-slate-400 max-w-xl">
          Gestiona los niveles de suscripción disponibles para las organizaciones en tiempo real.
        </p>
        <Button onClick={openCreateModal} className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 px-6 rounded-2xl shadow-lg shadow-purple-500/20 shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Plan
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      )}

      {!loading && plans.length === 0 && (
        <div className="py-16 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
          No hay planes creados. Crea el primero con el botón "Nuevo Plan".
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className={`rounded-xl border p-6 flex flex-col relative ${plan.color}`}>
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                Más Popular
              </span>
            )}

            <div className="mb-4">
              {plan.icon}
            </div>

            <h3 className="text-xl font-bold text-slate-200">{plan.name}</h3>
            <p className="text-sm text-slate-400 mt-2 min-h-[40px]">{plan.description}</p>

            <div className="my-6">
              <span className="text-4xl font-bold text-white">{plan.price}</span>
              <span className="text-slate-500 font-medium">{plan.period}</span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="flex gap-2">
              <Button
                onClick={() => openEditModal(plan)}
                className={`flex-1 ${plan.buttonVariant === "default" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"}`}
              >
                Editar
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 text-red-400 border-slate-700 bg-slate-800 hover:bg-red-500/10 hover:border-red-500/40"
                onClick={() => setConfirmDeletePlan(plan)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !saving && setIsModalOpen(false)}
        title={editingPlan ? "Editar Plan" : "Nuevo Plan"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={saving} className="text-slate-300 hover:bg-slate-800 hover:text-white">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim() || !formData.price.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : editingPlan ? "Guardar cambios" : "Crear Plan"}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre del Plan</label>
              <Input
                className="bg-slate-950 border-slate-800"
                placeholder="ej. Starter"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Precio</label>
              <Input
                className="bg-slate-950 border-slate-800"
                placeholder="ej. $29.990"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Período</label>
              <Input
                className="bg-slate-950 border-slate-800"
                placeholder="ej. /mes"
                value={formData.period}
                onChange={(e) => setFormData((prev) => ({ ...prev, period: e.target.value }))}
              />
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-purple-500"
                  checked={formData.popular}
                  onChange={(e) => setFormData((prev) => ({ ...prev, popular: e.target.checked }))}
                />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Más Popular</span>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Descripción</label>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe brevemente este plan..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Beneficios Incluidos</label>
            {formData.features.map((feature, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  className="bg-slate-950 border-slate-800 flex-1"
                  placeholder={`Beneficio ${i + 1}`}
                  value={feature}
                  onChange={(e) => updateFeature(i, e.target.value)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-red-400 border-slate-800 bg-slate-950 hover:bg-red-500/10"
                  onClick={() => removeFeature(i)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
              onClick={addFeature}
            >
              <Plus className="w-4 h-4 mr-2" /> Agregar beneficio
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!confirmDeletePlan}
        onClose={() => !deleting && setConfirmDeletePlan(null)}
        title="Eliminar Plan"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDeletePlan(null)} disabled={deleting} className="text-slate-300 hover:bg-slate-800 hover:text-white">
              Cancelar
            </Button>
            <Button onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Eliminando...</> : "Eliminar"}
            </Button>
          </>
        }
      >
        <p className="text-slate-300 text-sm">
          ¿Estás seguro de que quieres eliminar el plan <span className="font-bold text-white">{confirmDeletePlan?.name}</span>? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </DashboardShell>
  );
}
