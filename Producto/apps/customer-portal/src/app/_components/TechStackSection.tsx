"use client";

import { AnimatedSection, staggerCard } from "./AnimatedSection";
import { SectionHeader } from "./SectionHeader";
import { motion } from "framer-motion";

const STACK = [
  { name: "Next.js 16", desc: "App Router · SSR/CSR", category: "Frontend" },
  { name: "React 19", desc: "Motor de UI", category: "Frontend" },
  { name: "TypeScript 5", desc: "Tipado estricto", category: "Frontend" },
  { name: "Tailwind CSS 4", desc: "Estilos utilitarios", category: "Frontend" },
  { name: "Framer Motion", desc: "Animaciones fluidas", category: "Frontend" },
  { name: "Supabase", desc: "PostgreSQL + Auth + Realtime", category: "Backend" },
  { name: "Turborepo", desc: "Monorepo con cache", category: "Infra" },
  { name: "Vercel", desc: "CI/CD automático", category: "Infra" },
];

const PACKAGES = [
  { name: "@menu-bites/ui", desc: "Componentes compartidos" },
  { name: "@menu-bites/auth", desc: "Sesión, hooks y utilidades" },
  { name: "@menu-bites/store", desc: "Estado global compartido" },
];

export function TechStackSection() {
  return (
    <AnimatedSection className="w-full mb-32 space-y-10" id="tecnologia">
      <SectionHeader
        label="Arquitectura"
        title="Stack tecnológico de producción"
      />
      <p className="text-center text-sm text-slate-400 -mt-4">
        Monorepo con 7 apps independientes y 3 paquetes compartidos
      </p>

      {/* Tech grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STACK.map((tech, i) => (
          <motion.div
            key={tech.name}
            custom={i}
            variants={staggerCard}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="p-4 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl text-center
                       hover:border-emerald-500/20 transition-all duration-500"
          >
            <p className="text-sm font-bold text-white">{tech.name}</p>
            <p className="text-[10px] text-slate-400 mt-1">{tech.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Shared packages */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {PACKAGES.map((pkg, i) => (
          <motion.div
            key={pkg.name}
            custom={i + STACK.length}
            variants={staggerCard}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="px-5 py-3 bg-emerald-500/5 border border-emerald-500/10 rounded-full
                       flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-xs font-bold text-emerald-400">{pkg.name}</span>
            <span className="text-[10px] text-slate-500">— {pkg.desc}</span>
          </motion.div>
        ))}
      </div>
    </AnimatedSection>
  );
}
