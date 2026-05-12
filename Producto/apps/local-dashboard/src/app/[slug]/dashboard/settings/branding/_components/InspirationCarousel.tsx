"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Check } from "lucide-react";
import { PALETTE_TEMPLATES } from "@/lib/constants/palettes";

/**
 * Propiedades del Carrusel de Inspiración
 * @param currentTheme - El tema que se está editando actualmente en el laboratorio
 * @param onSelectTheme - Función para actualizar el tema principal al seleccionar un preset
 */
interface InspirationCarouselProps {
  currentTheme: any;
  onSelectTheme: (theme: any) => void;
}

/**
 * InspirationCarousel
 * 
 * Este componente renderiza una lista horizontal de "presets" o plantillas de diseño.
 * Permite al usuario elegir una base estética (colores y estilo) con un solo clic.
 */
export default function InspirationCarousel({ currentTheme, onSelectTheme }: InspirationCarouselProps) {
  return (
    <section className="space-y-6">
      {/* Cabecera del Carrusel con Estética de Alta Fidelidad */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-2xl">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground uppercase italic tracking-tight">Carrusel de Inspiración</h2>
            <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Selecciona una base para tu marca</p>
          </div>
        </div>
      </div>
      
      {/* Contenedor con Scroll Horizontal y Ocultación de Barras */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2 no-scrollbar px-2 -mx-2">
        {PALETTE_TEMPLATES.map((tpl) => (
          <motion.button
            key={tpl.id}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectTheme({ 
              ...tpl, 
              // Mantenemos las fuentes actuales para no sobreescribir la elección tipográfica del usuario
              fontTitle: currentTheme.fontTitle, 
              fontBody: currentTheme.fontBody, 
              fontAccent: currentTheme.fontAccent 
            })}
            className={`flex-shrink-0 w-64 p-5 rounded-[2rem] border transition-all duration-500 text-left relative overflow-hidden group ${
              currentTheme.paletteName === tpl.id 
                ? "bg-primary border-primary shadow-2xl shadow-primary/30" 
                : "bg-foreground/5 border-foreground/5 hover:bg-foreground/10"
            }`}
          >
            {/* Contenido Visual del Preset */}
            <div className="relative z-10">
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${currentTheme.paletteName === tpl.id ? "text-primary-foreground/60" : "text-primary"}`}>
                {tpl.description}
              </p>
              <h3 className={`text-sm font-black uppercase italic mb-6 ${currentTheme.paletteName === tpl.id ? "text-primary-foreground" : "text-foreground"}`}>
                {tpl.name}
              </h3>
              
              {/* Muestras de Color de la Paleta */}
              <div className="flex gap-1.5">
                {[tpl.primaryColor, tpl.secondaryColor, tpl.backgroundColor].map((c, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            
            {/* Indicador de Selección Activa */}
            {currentTheme.paletteName === tpl.id && (
              <div className="absolute top-5 right-5">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            
            {/* Efecto de Brillo de Cristal en la Esquina */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-foreground/10 rounded-full blur-2xl group-hover:bg-foreground/20 transition-all" />
          </motion.button>
        ))}
      </div>
    </section>
  );
}
