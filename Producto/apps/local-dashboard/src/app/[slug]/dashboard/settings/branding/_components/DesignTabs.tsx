"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import { Palette, Type, Image as ImageIcon } from "lucide-react";
import { ColorLaboratory } from "./ColorLaboratory";
import { TypographyManager } from "./TypographyManager";
import { CorporateIdentity } from "./CorporateIdentity";

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
export function DesignTabs({ 
  activeTab, 
  setActiveTab, 
  currentTheme, 
  setCurrentTheme, 
  slug 
}: DesignTabsProps) {
  return (
    <div className="lg:col-span-7 space-y-8">
      {/* Selector de Pestañas Sólido */}
      <div className="flex p-1.5 bg-card rounded-3xl border border-border sticky top-24 z-30 shadow-2xl">
        <TabButton 
          active={activeTab === 'style'} 
          onClick={() => setActiveTab('style')} 
          icon={<Palette className="w-4 h-4" />} 
          label="Estilo" 
        />
        <TabButton 
          active={activeTab === 'fonts'} 
          onClick={() => setActiveTab('fonts')} 
          icon={<Type className="w-4 h-4" />} 
          label="Fuentes" 
        />
        <TabButton 
          active={activeTab === 'business'} 
          onClick={() => setActiveTab('business')} 
          icon={<ImageIcon className="w-4 h-4" />} 
          label="Negocio" 
        />
      </div>

      <div className="min-h-[450px]">
        <AnimatePresence mode="wait">
          {activeTab === "style" && (
            <ColorLaboratory 
              key="style" 
              currentTheme={currentTheme} 
              setCurrentTheme={setCurrentTheme} 
            />
          )}

          {activeTab === "fonts" && (
            <TypographyManager 
              key="fonts" 
              currentTheme={currentTheme} 
              setCurrentTheme={setCurrentTheme} 
            />
          )}

          {activeTab === "business" && (
            <CorporateIdentity 
              key="business" 
              currentTheme={currentTheme} 
              setCurrentTheme={setCurrentTheme} 
              slug={slug} 
            />
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
function TabButton({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string 
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
        active 
          ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]" 
          : "text-foreground/40 hover:text-foreground hover:bg-foreground/5"
      }`}
    >
      {icon} {label}
    </button>
  );
}
