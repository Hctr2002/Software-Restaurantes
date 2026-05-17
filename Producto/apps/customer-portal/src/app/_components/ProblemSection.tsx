"use client";

/**
 * ProblemSection — Sección de problemas que resuelve Menu Bites (landing page).
 * Presenta los pain points del sector gastronómico: tiempos, errores, datos, costos.
 */

import { Clock, FileX2, BarChart3, DollarSign } from "lucide-react";
import { AnimatedSection, staggerCard } from "./AnimatedSection";
import { SectionHeader } from "./SectionHeader";
import { motion } from "framer-motion";

const PROBLEMS = [
  {
    icon: Clock,
    title: "Tiempos de espera excesivos",
    desc: "Los pedidos manuales en papel generan colas, errores y clientes insatisfechos.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: FileX2,
    title: "Comandas perdidas o ilegibles",
    desc: "Sin trazabilidad digital, hasta el 25% de los pedidos tiene errores de transcripción.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: BarChart3,
    title: "Cero visibilidad del negocio",
    desc: "El dueño no tiene datos en tiempo real: ventas, tiempos de cocina, rendimiento del personal.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: DollarSign,
    title: "Ineficiencia operativa",
    desc: "Personal sobrecargado por procesos manuales que podrían automatizarse.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
];

export function ProblemSection() {
  return (
    <AnimatedSection className="w-full mb-32 space-y-10">
      <SectionHeader label="El Problema" title="¿Por qué necesitan Menu Bites?" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {PROBLEMS.map((p, i) => (
          <motion.div
            key={p.title}
            custom={i}
            variants={staggerCard}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="group p-6 bg-card border border-white/5 rounded-3xl
                       hover:border-red-500/20 transition-all duration-500 shadow-xl"
          >
            <div className={`w-12 h-12 ${p.bg} rounded-2xl flex items-center justify-center mb-4 
                            group-hover:scale-110 transition-transform duration-500`}>
              <p.icon className={`w-6 h-6 ${p.color}`} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{p.title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{p.desc}</p>
          </motion.div>
        ))}
      </div>
    </AnimatedSection>
  );
}
