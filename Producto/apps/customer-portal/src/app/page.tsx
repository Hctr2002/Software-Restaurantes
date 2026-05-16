"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QrCode, Utensils, Star, ArrowRight, Store, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, scaleIn } from "./_components/AnimatedSection";
import { ProblemSection } from "./_components/ProblemSection";
import { EcosystemSection } from "./_components/EcosystemSection";
import { OperationalFlowSection } from "./_components/OperationalFlowSection";
import { BenefitsSection } from "./_components/BenefitsSection";
import { TechStackSection } from "./_components/TechStackSection";
import { TeamSection } from "./_components/TeamSection";

export default function Home() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const adminUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000";

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] glow-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-emerald-500/[0.02] rounded-full blur-[150px]" />
      </div>

      {/* ═══════════ Navbar ═══════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full transition-all duration-500 ${
          scrolled
            ? "py-3 bg-slate-950/80 backdrop-blur-xl border-b border-white/5"
            : ""
        }`}
      >
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Utensils className="w-5 h-5 text-slate-950" />
          </div>
          <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Menu<span className="text-emerald-500">Bites</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
          <a href="#restaurantes" className="hover:text-white transition-colors duration-300">Ecosistema</a>
          <a href="#como-funciona" className="hover:text-white transition-colors duration-300">Cómo funciona</a>
          <a href="#tecnologia" className="hover:text-white transition-colors duration-300">Tecnología</a>
        </div>

        <a
          href={adminUrl}
          id="nav-cta-restaurants"
          className="px-5 py-2.5 bg-white/5 border border-white/15 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/15 hover:border-white/25 hover:text-white transition-all duration-300 active:scale-95 flex items-center gap-2"
        >
          Para Restaurantes <ArrowRight className="w-3 h-3" />
        </a>
      </nav>

      {/* ═══════════ Hero Section ═══════════ */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-6 pt-32 pb-24 max-w-5xl mx-auto w-full">

        {/* Hero Content */}
        <div className="flex flex-col items-center text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8"
          >
            <Star className="w-3 h-3 fill-current" />
            Sistema de Gestión Gastronómica
          </motion.div>

          <motion.h1
            custom={0.15}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[0.9] lg:max-w-4xl"
          >
            Pide sin <span className="text-emerald-500">esperas</span>, disfruta sin{" "}
            <span className="relative inline-block">
              límites
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-emerald-500/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 25 0 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </span>.
          </motion.h1>

          <motion.p
            custom={0.35}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-lg md:text-xl text-slate-300 font-medium mb-12 max-w-2xl leading-relaxed"
          >
            Plataforma SaaS multitenant que digitaliza la operación completa del restaurante — desde el menú QR hasta los reportes de negocio.
          </motion.p>

          <motion.div
            custom={0.5}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-center gap-4 mb-20"
          >
            <button
              id="cta-scan-qr"
              onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
              className="group px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base rounded-2xl 
                         transition-all duration-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.35)] hover:scale-[1.03] 
                         active:scale-95 flex items-center gap-3"
            >
              <QrCode className="w-5 h-5" />
              Descubre cómo funciona
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            <a
              href={adminUrl}
              id="cta-restaurant-owner"
              className="px-8 py-4 bg-white/5 border border-white/15 hover:bg-white/10 hover:border-white/30 
                         text-white font-bold text-base rounded-2xl transition-all duration-300 flex items-center gap-2 active:scale-95"
            >
              <Store className="w-5 h-5 text-emerald-500" />
              Soy dueño de restaurante
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <ChevronDown className="w-5 h-5 text-slate-500 animate-bounce" />
          </motion.div>
        </div>

        {/* ═══════════ Content Sections ═══════════ */}
        <ProblemSection />
        <EcosystemSection />
        <OperationalFlowSection />
        <BenefitsSection />

        {/* ═══════════ QR CTA Card ═══════════ */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="relative w-full max-w-xl group cursor-default mb-32"
        >
          <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-10 glow-pulse" />
          <div className="relative flex flex-col items-center gap-6 p-12 bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-[3rem] shadow-2xl hover:border-emerald-500/20 transition-all duration-500">
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center shadow-xl float-animation">
              <QrCode className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="space-y-3 text-center">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">¿Estás en un restaurante?</h2>
              <p className="text-sm text-slate-300 max-w-sm leading-relaxed">Busca el código QR en tu mesa. No necesitas descargar ninguna App.</p>
            </div>
          </div>
        </motion.div>

        <TechStackSection />
        <TeamSection />
      </main>

      {/* ═══════════ Footer ═══════════ */}
      <footer className="relative z-10 px-6 py-16 mt-8 border-t border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Utensils className="w-3 h-3 text-slate-950" />
            </div>
            <span className="text-sm font-black tracking-tighter">
              Menu<span className="text-emerald-500">Bites</span>
            </span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
            © 2026 Gastro Analytics 360 · Duoc UC · All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
