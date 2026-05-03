"use client";

import React from "react";
import { Button, RestaurantThemeProvider } from "@menu-bites/ui";
import { Monitor, Smartphone, Sparkles } from "lucide-react";
import { hexToHslValues } from "./utils";

/**
 * Propiedades del Simulador Live
 * @param currentTheme - Tema que se está previsualizando
 * @param sampleProduct - Producto real del menú para mostrar en el simulador
 */
interface LivePreviewProps {
  currentTheme: any;
  sampleProduct: any;
}

/**
 * LivePreview
 * 
 * Renderiza un mockup de iPhone que previsualiza los cambios de branding en tiempo real.
 * Inyecta las fuentes de Google y los colores dinámicamente mediante variables CSS.
 */
export default function LivePreview({ currentTheme, sampleProduct }: LivePreviewProps) {
  return (
    <div className="sticky top-24 space-y-6">
      {/* Indicadores de Estado y Dispositivo */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">Simulación Live</h2>
        </div>
        <div className="flex gap-2">
           <div className="p-1.5 rounded-lg bg-white/5 text-foreground/20"><Monitor className="w-3 h-3" /></div>
           <div className="p-1.5 rounded-lg bg-primary/20 text-primary"><Smartphone className="w-3 h-3" /></div>
        </div>
      </div>

      {/* Mockup del Dispositivo con Borde de Pantalla Premium */}
      <div className="rounded-[3.5rem] border-[12px] border-black shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden aspect-[9/18.5] relative bg-background transition-all duration-700">
        <RestaurantThemeProvider theme={currentTheme}>
          <div 
            className="h-full flex flex-col p-8 space-y-8 relative z-10"
            style={{
              backgroundColor: `hsl(${hexToHslValues(currentTheme.backgroundColor)})`,
              "--font-title":  `"${currentTheme.fontTitle || 'Outfit'}", sans-serif`,
              "--font-body":   `"${currentTheme.fontBody  || 'Inter'}",  sans-serif`,
              "--font-accent": `"${currentTheme.fontAccent || 'Outfit'}", sans-serif`,
            } as any}
          >
            {/* Barra de Estado (Mock) */}
            <div className="flex justify-between items-center opacity-30 px-2">
              <span className="text-[10px] font-black">9:41</span>
              <div className="flex gap-1.5">
                <div className="w-3.5 h-2.5 border border-foreground/50 rounded-[2px]" />
                <div className="w-3.5 h-3.5 bg-foreground rounded-full" />
              </div>
            </div>

            {/* Contenido Principal de la App simulada */}
            <div className="flex-1 flex flex-col justify-start space-y-6 pt-4">
              {/* Tarjeta de Producto con Imagen Real del Bucket */}
              <div className="glass rounded-[3rem] border-white/10 overflow-hidden shadow-2xl flex flex-col group">
                <div className="h-48 w-full relative overflow-hidden">
                  {sampleProduct?.image_url ? (
                    <img 
                      src={sampleProduct.image_url} 
                      alt={sampleProduct.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                       <Sparkles className="w-12 h-12 text-primary/40 animate-pulse" />
                    </div>
                  )}
                  {/* Badge de Acento que usa la fuente seleccionada */}
                  <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md shadow-xl" style={{ backgroundColor: "hsl(var(--accent))" }}>
                     <span className="text-[9px] font-black text-background uppercase tracking-widest" style={{ fontFamily: "var(--font-accent)" }}>Destacado</span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-xl font-black italic uppercase leading-none tracking-tight" style={{ fontFamily: "var(--font-title)", color: "hsl(var(--foreground))" }}>
                      {sampleProduct?.name || "Plato Estrella"}
                    </h3>
                    <span className="text-lg font-black text-primary shrink-0" style={{ fontFamily: "var(--font-accent)" }}>
                       {sampleProduct?.price ? `$${new Intl.NumberFormat("es-CL").format(sampleProduct.price)}` : "$9.990"}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-foreground/40 leading-relaxed line-clamp-2" style={{ fontFamily: "var(--font-body)" }}>
                     {sampleProduct?.description || "Una experiencia sensorial única preparada con los mejores ingredientes locales."}
                  </p>
                  {/* Botón de Acción Principal con Color Primario */}
                  <Button className="w-full h-12 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                     Añadir al Carrito
                  </Button>
                </div>
              </div>
            </div>

            {/* Home Indicator (Mock) */}
            <div className="h-1 w-1/3 bg-foreground/10 rounded-full mx-auto mt-auto mb-2" />
          </div>
        </RestaurantThemeProvider>
      </div>
    </div>
  );
}
