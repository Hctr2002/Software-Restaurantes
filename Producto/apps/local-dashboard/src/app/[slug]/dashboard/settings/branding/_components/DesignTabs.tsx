"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Input, Button } from "@menu-bites/ui";
import { Palette, Type, Image as ImageIcon, Info } from "lucide-react";
import { TITLE_FONTS, BODY_FONTS } from "./constants";

/**
 * Propiedades del Sistema de Pestañas
 */
interface DesignTabsProps {
  activeTab: "style" | "fonts" | "business";
  setActiveTab: (tab: "style" | "fonts" | "business") => void;
  currentTheme: any;
  setCurrentTheme: (theme: any) => void;
  slug: string;
}

/**
 * DesignTabs
 * 
 * Orquesta las tres áreas principales de configuración de marca: 
 * Colores (Estilo), Tipografía (Fuentes) e Identidad (Negocio).
 */
export default function DesignTabs({ 
  activeTab, 
  setActiveTab, 
  currentTheme, 
  setCurrentTheme, 
  slug 
}: DesignTabsProps) {
  return (
    <div className="lg:col-span-7 space-y-8">
      {/* Selector de Pestañas con Efecto de Cristal */}
      <div className="flex p-1.5 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 sticky top-24 z-30 shadow-2xl">
        <TabButton active={activeTab === 'style'} onClick={() => setActiveTab('style')} icon={<Palette className="w-4 h-4" />} label="Estilo" />
        <TabButton active={activeTab === 'fonts'} onClick={() => setActiveTab('fonts')} icon={<Type className="w-4 h-4" />} label="Fuentes" />
        <TabButton active={activeTab === 'business'} onClick={() => setActiveTab('business')} icon={<ImageIcon className="w-4 h-4" />} label="Negocio" />
      </div>

      <div className="min-h-[450px]">
        <AnimatePresence mode="wait">
          {/* Pestaña de Estilo: Laboratorio de Color */}
          {activeTab === "style" && (
            <motion.div 
              key="style"
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <Card className="p-8 bg-white/5 border-white/5 rounded-[2.5rem] shadow-2xl space-y-10">
                <div>
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Laboratorio de Color</h3>
                  <p className="text-xs text-foreground/40 font-medium">Ajusta cada matiz de la experiencia visual</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <ColorInput label="Primario" value={currentTheme.primaryColor} onChange={(c) => setCurrentTheme({...currentTheme, primaryColor: c, paletteName: 'custom'})} />
                  <ColorInput label="Fondo" value={currentTheme.backgroundColor} onChange={(c) => setCurrentTheme({...currentTheme, backgroundColor: c, paletteName: 'custom'})} />
                  <ColorInput label="Texto" value={currentTheme.textColor} onChange={(c) => setCurrentTheme({...currentTheme, textColor: c, paletteName: 'custom'})} />
                  <ColorInput label="Acento" value={currentTheme.accentColor} onChange={(c) => setCurrentTheme({...currentTheme, accentColor: c, paletteName: 'custom'})} />
                  <ColorInput label="Tarjetas" value={currentTheme.cardBackground} onChange={(c) => setCurrentTheme({...currentTheme, cardBackground: c, paletteName: 'custom'})} />
                  <ColorInput label="Secundario" value={currentTheme.secondaryColor} onChange={(c) => setCurrentTheme({...currentTheme, secondaryColor: c, paletteName: 'custom'})} />
                </div>
              </Card>
            </motion.div>
          )}

          {/* Pestaña de Fuentes: Jerarquía Tipográfica */}
          {activeTab === "fonts" && (
            <motion.div 
              key="fonts"
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <Card className="p-8 bg-white/5 border-white/5 rounded-[2.5rem] shadow-2xl space-y-10">
                <div>
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Jerarquía Tipográfica</h3>
                  <p className="text-xs text-foreground/40 font-medium">Define la voz visual de tu restaurante</p>
                </div>
                
                <div className="space-y-8">
                  <FontSelector label="Títulos & Categorías" value={currentTheme.fontTitle} options={TITLE_FONTS} onChange={(f) => setCurrentTheme({...currentTheme, fontTitle: f})} />
                  <FontSelector label="Cuerpo & Lectura" value={currentTheme.fontBody} options={BODY_FONTS} onChange={(f) => setCurrentTheme({...currentTheme, fontBody: f})} />
                  <FontSelector label="Navegación & Precios" value={currentTheme.fontAccent} options={TITLE_FONTS} onChange={(f) => setCurrentTheme({...currentTheme, fontAccent: f})} />
                </div>
              </Card>
            </motion.div>
          )}

          {/* Pestaña de Negocio: Identidad Corporativa */}
          {activeTab === "business" && (
            <motion.div 
              key="business"
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <Card className="p-8 bg-white/5 border-white/5 rounded-[2.5rem] shadow-2xl space-y-10">
                <div>
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Identidad Corporativa</h3>
                  <p className="text-xs text-foreground/40 font-medium">Configuración base de tu local</p>
                </div>
                
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest px-1">URL del Logo</label>
                    <Input 
                      value={currentTheme.logoUrl || ""} 
                      onChange={(e) => setCurrentTheme({...currentTheme, logoUrl: e.target.value})}
                      placeholder="https://tu-sitio.com/logo.png"
                      className="bg-white/5 border-white/10 rounded-2xl h-14 px-6 text-sm font-bold"
                    />
                  </div>
                  
                  <div className="p-8 rounded-[2.5rem] border border-white/10 bg-white/5 flex items-center justify-between group">
                    <div>
                      <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] mb-1">Slug de Acceso</p>
                      <code className="text-xl font-black text-primary tracking-tighter italic">/{slug}</code>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                       <Info className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Sub-componente: TabButton
 * Botón estilizado para el selector de pestañas principal.
 */
function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
        active 
          ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]" 
          : "text-foreground/40 hover:text-foreground hover:bg-white/5"
      }`}
    >
      {icon} {label}
    </button>
  );
}

/**
 * Sub-componente: ColorInput
 * Campo de selección de color con previsualización de código Hex.
 */
function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) {
  return (
    <div className="space-y-3 group">
      <label className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em] px-1 group-hover:text-primary transition-colors">
        {label}
      </label>
      <div className="relative flex items-center">
        <input 
          type="color" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded-2xl border-none p-0 bg-transparent cursor-pointer overflow-hidden shadow-xl"
        />
        <div className="ml-3 flex-1 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 font-mono text-[10px] font-bold text-foreground/60">
          {value.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

/**
 * Sub-componente: FontSelector
 * Selector desplegable que aplica la tipografía seleccionada a su propia visualización.
 */
function FontSelector({ label, value, options, onChange }: { label: string; value: string; options: any[]; onChange: (f: string) => void }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest flex items-center gap-2 px-1">
        <div className="w-1 h-4 bg-primary/40 rounded-full" /> {label}
      </label>
      <select
        value={value || "Outfit"}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] h-14 px-6 text-sm text-foreground font-bold outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer hover:bg-white/10 transition-all"
        style={{ fontFamily: `"${value || 'Outfit'}", sans-serif` }}
      >
        {options.map(f => (
          <option key={f.value} value={f.value} className="bg-background text-foreground">{f.label}</option>
        ))}
      </select>
    </div>
  );
}
