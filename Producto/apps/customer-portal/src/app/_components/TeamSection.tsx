"use client";

/**
 * TeamSection — Sección del equipo de desarrollo para la landing page.
 * Presenta a los integrantes del proyecto con nombre, rol e institución.
 */

import { GraduationCap } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { motion } from "framer-motion";

const TEAM = [
  { name: "José Luis Medina Mercado", role: "Líder Técnico" },
  { name: "Héctor Robledo", role: "Arquitecto de Datos" },
  { name: "Alejandro Placencia Menares", role: "Desarrollador Fullstack" },
];

export function TeamSection() {
  return (
    <AnimatedSection className="w-full mb-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
        className="relative max-w-lg mx-auto"
      >
        <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-5" />
        <div className="relative flex flex-col items-center gap-6 p-10 bg-gradient-to-b from-slate-900 to-slate-950 
                        border border-white/10 rounded-[2.5rem] text-center">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl 
                          flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-emerald-500" />
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/50">
              Proyecto de Titulación
            </p>
            <h3 className="text-xl font-black text-white">Duoc UC · 2026</h3>
          </div>

          <div className="w-full space-y-3">
            {TEAM.map((member) => (
              <div key={member.name} className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] rounded-xl">
                <span className="text-sm font-semibold text-white">{member.name}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{member.role}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatedSection>
  );
}
