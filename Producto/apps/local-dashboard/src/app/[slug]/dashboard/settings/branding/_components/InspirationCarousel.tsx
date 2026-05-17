/**
 * InspirationCarousel — Carrusel horizontal de paletas de inspiración para el Laboratorio de Branding.
 * Al seleccionar una tarjeta se aplica el preset completo (colores + tipografías) sin marcarlo como dirty.
 */
"use client";

import React, { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { PALETTE_TEMPLATES } from "@/lib/constants/palettes";

interface InspirationCarouselProps {
  currentTheme: any;
  onSelectTheme: (theme: any) => void;
}

const CARD_WIDTH = 272; // w-64 (256) + gap-4 (16)
const VISIBLE_CARDS = 4;
const SCROLL_STEP = CARD_WIDTH * VISIBLE_CARDS;

export function InspirationCarousel({ currentTheme, onSelectTheme }: InspirationCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPos, setScrollPos] = useState(0);

  const totalWidth = CARD_WIDTH * PALETTE_TEMPLATES.length;

  const scroll = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const next = dir === "right"
      ? Math.min(el.scrollLeft + SCROLL_STEP, totalWidth)
      : Math.max(el.scrollLeft - SCROLL_STEP, 0);
    el.scrollTo({ left: next, behavior: "smooth" });
  }, [totalWidth]);

  const handleScroll = () => {
    if (scrollRef.current) setScrollPos(scrollRef.current.scrollLeft);
  };

  const maxScroll = totalWidth - (CARD_WIDTH * VISIBLE_CARDS);
  const progress = maxScroll > 0 ? Math.min(scrollPos / maxScroll, 1) : 0;
  const canLeft = scrollPos > 4;
  const canRight = scrollPos < maxScroll - 4;

  return (
    <section className="space-y-4">
      {/* Header */}
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

        {/* Flechas de navegación */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canLeft}
            className="w-9 h-9 flex items-center justify-center rounded-2xl bg-foreground/5 border border-foreground/10 text-foreground/50 hover:bg-foreground/10 hover:text-foreground transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canRight}
            className="w-9 h-9 flex items-center justify-center rounded-2xl bg-foreground/5 border border-foreground/10 text-foreground/50 hover:bg-foreground/10 hover:text-foreground transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carrusel */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar px-2 -mx-2"
      >
        {PALETTE_TEMPLATES.map((tpl) => {
          const isActive = currentTheme.paletteName === tpl.id || currentTheme.id === tpl.id;
          return (
            <motion.button
              key={tpl.id}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectTheme(tpl)}
              className={`flex-shrink-0 w-64 p-5 rounded-[2rem] border transition-all duration-500 text-left relative overflow-hidden group ${
                isActive
                  ? "bg-primary border-primary shadow-2xl shadow-primary/30"
                  : "bg-foreground/5 border-foreground/5 hover:bg-foreground/10"
              }`}
            >
              <div className="relative z-10">
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isActive ? "text-primary-foreground/60" : "text-primary"}`}>
                  {tpl.description}
                </p>
                <h3 className={`text-sm font-black uppercase italic mb-6 ${isActive ? "text-primary-foreground" : "text-foreground"}`}>
                  {tpl.name}
                </h3>
                <div className="flex gap-1.5">
                  {[tpl.primaryColor, tpl.secondaryColor, tpl.backgroundColor].map((c, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              {isActive && (
                <div className="absolute top-5 right-5">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-foreground/10 rounded-full blur-2xl group-hover:bg-foreground/20 transition-all" />
            </motion.button>
          );
        })}
      </div>

      {/* Barra de progreso */}
      <div className="px-2">
        <div className="h-1 w-full bg-foreground/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary/50 rounded-full"
            animate={{ width: `${Math.max((1 / Math.ceil(PALETTE_TEMPLATES.length / VISIBLE_CARDS)) * 100, 8) + progress * (100 - Math.max((1 / Math.ceil(PALETTE_TEMPLATES.length / VISIBLE_CARDS)) * 100, 8))}%`, x: `${progress * (100 - (1 / Math.ceil(PALETTE_TEMPLATES.length / VISIBLE_CARDS)) * 100)}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
        <div className="flex justify-between mt-1.5 px-0.5">
          <span className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">1</span>
          <span className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">{PALETTE_TEMPLATES.length} diseños</span>
        </div>
      </div>
    </section>
  );
}
