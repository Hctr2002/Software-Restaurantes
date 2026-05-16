"use client";

import {
  Shield, LayoutDashboard, CookingPot, ConciergeBell,
  Receipt, Smartphone, Wine,
} from "lucide-react";
import { AnimatedSection, staggerCard } from "./AnimatedSection";
import { SectionHeader } from "./SectionHeader";
import { motion } from "framer-motion";

const APPS = [
  {
    icon: Shield,
    name: "Admin Dashboard",
    role: "SUPER_ADMIN",
    features: ["KPIs globales de la red", "Gestión de restaurantes y planes SaaS", "Asignación de roles y usuarios"],
    accent: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "hover:border-violet-500/30",
  },
  {
    icon: LayoutDashboard,
    name: "Panel Local",
    role: "ADMIN",
    features: ["Menú, inventario y mesas + QR", "Reportes exportables a Excel", "Branding Lab con 12 templates"],
    accent: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "hover:border-blue-500/30",
  },
  {
    icon: CookingPot,
    name: "Kitchen KDS",
    role: "COCINA",
    features: ["Kanban en tiempo real", "Temporizadores con código de color", "Modo offline con Service Worker"],
    accent: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "hover:border-orange-500/30",
  },
  {
    icon: ConciergeBell,
    name: "Waiter Terminal",
    role: "GARZÓN",
    features: ["Mapa de mesas en vivo", "Toma de pedidos + validación", "Fusión de mesas y Web Push"],
    accent: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "hover:border-emerald-500/30",
  },
  {
    icon: Receipt,
    name: "Cashier Dashboard",
    role: "CAJERO",
    features: ["Cuentas agrupadas por mesa/sesión", "Cobro con propina y comprobante", "Cierre de turno con reporte"],
    accent: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "hover:border-amber-500/30",
  },
  {
    icon: Smartphone,
    name: "Customer Portal",
    role: "CLIENTE",
    features: ["Menú digital vía QR sin app", "Tracker de pedido en tiempo real", "Rating y solicitar cuenta"],
    accent: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "hover:border-cyan-500/30",
  },
  {
    icon: Wine,
    name: "Bar Dashboard",
    role: "BAR",
    features: ["KDS dedicado para bebidas", "Alerta de stock y auto-despacho", "Pedidos mixtos cocina + barra"],
    accent: "text-pink-500",
    bg: "bg-pink-500/10",
    border: "hover:border-pink-500/30",
  },
];

export function EcosystemSection() {
  return (
    <AnimatedSection className="w-full mb-32 space-y-10" id="restaurantes">
      <SectionHeader label="Ecosistema Completo" title="7 pantallas, un solo sistema" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {APPS.map((app, i) => (
          <motion.div
            key={app.name}
            custom={i}
            variants={staggerCard}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`group relative p-6 bg-card border border-white/5 rounded-3xl
                       transition-all duration-500 shadow-xl ${app.border}`}
          >
            {/* Role badge */}
            <span className={`absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest ${app.accent} opacity-40`}>
              {app.role}
            </span>

            <div className={`w-12 h-12 ${app.bg} rounded-2xl flex items-center justify-center mb-4
                            group-hover:scale-110 transition-transform duration-500`}>
              <app.icon className={`w-6 h-6 ${app.accent}`} />
            </div>

            <h3 className="text-lg font-bold text-white mb-3">{app.name}</h3>

            <ul className="space-y-1.5">
              {app.features.map((f) => (
                <li key={f} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                  <span className={`mt-1 w-1 h-1 rounded-full ${app.bg} shrink-0`} />
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </AnimatedSection>
  );
}
