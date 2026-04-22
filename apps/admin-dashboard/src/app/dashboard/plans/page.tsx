"use client";

import React, { useState } from "react";
import DashboardShell from "../_components/DashboardShell";
import { Button, Input } from "@menu-bites/ui";
import { CheckCircle2, Building2, Zap, Rocket } from "lucide-react";
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

const initialPlans: Plan[] = [
  {
    id: "basic",
    name: "Básico",
    price: "$29",
    period: "/mes",
    description: "Perfecto para pequeños restaurantes que comienzan con menús digitales.",
    icon: <Rocket className="w-6 h-6 text-blue-400" />,
    features: [
      "Hasta 50 ítems en el menú",
      "Generación de Códigos QR",
      "Gestión básica de pedidos",
      "Soporte por correo"
    ],
    color: "border-slate-800 bg-slate-900/50",
    buttonVariant: "outline",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$79",
    period: "/mes",
    description: "Ideal para restaurantes en crecimiento que necesitan pantallas de cocina y POS.",
    icon: <Zap className="w-6 h-6 text-purple-400" />,
    features: [
      "Ítems de menú ilimitados",
      "Sistema de Pantalla de Cocina (KDS)",
      "Acceso a Terminal de Meseros",
      "Análisis Avanzados",
      "Soporte prioritario 24/7"
    ],
    color: "border-purple-500/50 bg-purple-500/10 relative",
    buttonVariant: "default",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Empresarial",
    price: "Personalizado",
    period: "",
    description: "Para cadenas de restaurantes que necesitan gestión de múltiples ubicaciones.",
    icon: <Building2 className="w-6 h-6 text-emerald-400" />,
    features: [
      "Todo lo de Pro",
      "Panel multi-tenant",
      "Soporte de dominio personalizado",
      "Gerente de cuenta dedicado",
      "Acceso a la API"
    ],
    color: "border-slate-800 bg-slate-900/50",
    buttonVariant: "outline",
  }
];

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    features: [] as string[],
  });

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      description: plan.description,
      features: [...plan.features],
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!editingPlan) return;

    setPlans(plans.map(p => {
      if (p.id === editingPlan.id) {
        return {
          ...p,
          name: formData.name,
          price: formData.price,
          description: formData.description,
          features: formData.features.filter(f => f.trim() !== ""),
        };
      }
      return p;
    }));

    setIsModalOpen(false);
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
      <div className="mb-8 max-w-3xl">
        <p className="text-slate-400">
          Gestiona los niveles de suscripción disponibles para las organizaciones. Actualmente, estos planes son conceptuales y están pendientes de la integración con Stripe.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className={`rounded-xl border p-6 flex flex-col ${plan.color}`}>
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

            <Button
              onClick={() => openEditModal(plan)}
              className={`w-full ${plan.buttonVariant === "default" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"}`}
            >
              Editar Plan
            </Button>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Editar Plan"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:bg-slate-800 hover:text-white">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              Guardar cambios
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="p-3 rounded-md border border-blue-500/30 bg-blue-500/10 text-sm text-blue-400 font-medium">
            Nota: Estos cambios son locales y no se guardan en la base de datos hasta integrar Stripe.
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre del Plan</label>
            <Input
              className="bg-slate-950 border-slate-800"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Precio</label>
            <Input
              className="bg-slate-950 border-slate-800"
              value={formData.price}
              onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Descripción</label>
            <textarea
              className="w-full min-h-[100px] rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  value={feature}
                  onChange={(e) => updateFeature(i, e.target.value)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-red-400 border-slate-800 bg-slate-950 hover:bg-red-500/10"
                  onClick={() => removeFeature(i)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
              onClick={addFeature}
            >
              + Agregar nuevo beneficio
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}
