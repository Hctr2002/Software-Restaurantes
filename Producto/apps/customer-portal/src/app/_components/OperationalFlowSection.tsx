"use client";

/**
 * OperationalFlowSection — Sección de flujo operacional para la landing page.
 * Ilustra el ciclo completo del pedido: portal → garzón → cocina/bar → caja → reportes.
 */

import {
  Smartphone, ConciergeBell, CookingPot, Wine, Receipt, BarChart3,
} from "lucide-react";
import { AnimatedSection, staggerCard } from "./AnimatedSection";
import { SectionHeader } from "./SectionHeader";
import { motion } from "framer-motion";

const STEPS = [
  {
    icon: Smartphone,
    role: "Cliente",
    title: "Escanea y pide",
    desc: "Escanea el QR de tu mesa, explora el menú con fotos y realiza tu pedido sin esperas.",
    status: "PENDING",
  },
  {
    icon: ConciergeBell,
    role: "Garzón",
    title: "Valida el pedido",
    desc: "Recibe la notificación, verifica disponibilidad y confirma. El ticket pasa a cocina.",
    status: "VALIDATED",
  },
  {
    icon: CookingPot,
    role: "Cocina",
    title: "Prepara en KDS",
    desc: "El ticket aparece en la pantalla Kanban. El chef inicia preparación y marca como listo.",
    status: "PREPARING",
  },
  {
    icon: Wine,
    role: "Barra",
    title: "Despacha bebidas",
    desc: "Los ítems de barra se preparan en paralelo. El pedido no cierra hasta que ambos terminan.",
    status: "PREPARING",
  },
  {
    icon: Receipt,
    role: "Cajero",
    title: "Cobra y cierra",
    desc: "Consolida la cuenta, procesa el pago y emite comprobante digital imprimible.",
    status: "DELIVERED",
  },
  {
    icon: BarChart3,
    role: "Admin",
    title: "Analiza datos",
    desc: "Ve reportes de ventas, tiempos de cocina y rendimiento del personal en tiempo real.",
    status: "COMPLETED",
  },
];

export function OperationalFlowSection() {
  return (
    <AnimatedSection className="w-full mb-32 space-y-12" id="como-funciona">
      <SectionHeader label="Flujo Operativo" title="El recorrido completo de un pedido" />

      <div className="relative max-w-2xl mx-auto">
        {/* Vertical connector line */}
        <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-emerald-500/50 via-emerald-500/20 to-transparent" />

        <div className="space-y-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              custom={i}
              variants={staggerCard}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className="relative flex items-start gap-5 pl-2"
            >
              {/* Timeline dot */}
              <div className="relative z-10 w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl 
                              flex items-center justify-center shrink-0">
                <step.icon className="w-5 h-5 text-emerald-500" />
              </div>

              <div className="flex-1 p-5 bg-card border border-white/5 rounded-2xl
                              hover:border-emerald-500/20 transition-all duration-500 shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/50">
                    {step.role}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">
                    {step.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-1">{step.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
