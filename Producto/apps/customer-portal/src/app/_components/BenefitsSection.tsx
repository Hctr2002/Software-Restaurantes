"use client";

import { Zap, TrendingUp, Palette, Bell } from "lucide-react";
import { AnimatedSection, staggerCard } from "./AnimatedSection";
import { SectionHeader } from "./SectionHeader";
import { motion } from "framer-motion";

const BENEFITS = [
  {
    icon: Zap,
    title: "Pedidos directos a cocina",
    desc: "Elimina intermediarios — del código QR al KDS en segundos, sin papel ni errores de transcripción.",
  },
  {
    icon: TrendingUp,
    title: "Reportes en tiempo real",
    desc: "Ventas diarias, top productos, desempeño de personal y ocupación de mesas — exportables a Excel.",
  },
  {
    icon: Palette,
    title: "Marca 100% personalizable",
    desc: "12 templates de branding, colores y tipografías que se propagan al portal del cliente al instante.",
  },
  {
    icon: Bell,
    title: "Alertas inteligentes",
    desc: "Stock crítico, pedidos sin validar >3min, solicitudes de asistencia y Web Push nativo al garzón.",
  },
];

export function BenefitsSection() {
  return (
    <AnimatedSection className="w-full mb-32 space-y-10">
      <SectionHeader label="Beneficios" title="Lo que gana tu negocio" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {BENEFITS.map((b, i) => (
          <motion.div
            key={b.title}
            custom={i}
            variants={staggerCard}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group p-6 bg-card border border-white/5 rounded-3xl
                       hover:border-emerald-500/20 transition-all duration-500 shadow-xl"
          >
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4
                            group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-500">
              <b.icon className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{b.title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{b.desc}</p>
          </motion.div>
        ))}
      </div>
    </AnimatedSection>
  );
}
