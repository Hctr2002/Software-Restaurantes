"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QrCode, Utensils, Zap, Star, ArrowRight, Store, MapPin } from "lucide-react";
import { getActiveRestaurants } from "@/lib/tenant";

export default function Home() {
  const router = useRouter();
  const [partners, setPartners] = useState<{id: string, name: string, slug: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPartners() {
      const data = await getActiveRestaurants();
      setPartners(data);
      setLoading(false);
    }
    loadPartners();
  }, []);

  const adminUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000";

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Utensils className="w-5 h-5 text-slate-950" />
          </div>
          <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Menu<span className="text-emerald-500">Bites</span>
          </span>
        </div>

        <a
          href={adminUrl}
          className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2"
        >
          Para Restaurantes <ArrowRight className="w-3 h-3" />
        </a>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-24 text-center max-w-5xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-bounce">
          <Star className="w-3 h-3 fill-current" />
          Nueva experiencia gastronómica
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tightest mb-8 leading-[0.9] lg:max-w-4xl">
          Pide sin <span className="text-emerald-500">esperas</span>, disfruta sin <span className="relative inline-block">
            límites
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-emerald-500/30" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 5 Q 25 0 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </span>.
        </h1>

        <p className="text-lg md:text-xl text-slate-400 font-medium mb-12 max-w-2xl leading-relaxed">
          Tu menú digital inteligente. Escanea el código QR en tu mesa para comenzar. No necesitas descargar nada.
        </p>

        {/* Directory Section - NUEVO */}
        <section className="w-full mb-32 space-y-10">
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-emerald-500/50">Partners Seleccionados</h2>
            <p className="text-2xl font-black tracking-tight text-white">Restaurantes en nuestra red</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
              ))
            ) : partners.length > 0 ? (
              partners.map((p) => (
                <div key={p.id} className="group p-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] flex items-center gap-4 transition-all duration-500 hover:bg-slate-900/60 cursor-default">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <Store className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-white text-lg leading-tight">{p.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                      <MapPin className="w-3 h-3" />
                      Disponible vía QR
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-slate-500 italic">Pronto anunciaremos nuevos partners...</p>
            )}
          </div>
        </section>

        {/* Steps Card */}
        <div className="w-full grid md:grid-cols-3 gap-6 mb-24">
          {[
            { icon: QrCode, title: "Escanea", desc: "Usa la cámara de tu móvil en el QR de tu mesa." },
            { icon: Utensils, title: "Elige", desc: "Explora el menú con fotos reales y detalles." },
            { icon: Zap, title: "Disfruta", desc: "Tu pedido llega directo a cocina al instante." }
          ].map((step, idx) => (
            <div key={idx} className="group p-8 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] text-left hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-2">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <step.icon className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black mb-3 text-white">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Floating "Scan" Call to Action */}
        <div className="relative w-full max-w-xl group cursor-default">
          <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-10" />
          <div className="relative flex flex-col items-center gap-6 p-10 bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-[3rem] shadow-2xl">
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center shadow-xl">
              <QrCode className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-white">¿Estás en un restaurante?</h2>
              <p className="text-sm text-slate-400">Busca el código QR en tu mesa. No necesitas descargar ninguna App.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/5 bg-slate-950/50 backdrop-blur-xl">
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
            © 2026 Gastro Analytics 360 · All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
