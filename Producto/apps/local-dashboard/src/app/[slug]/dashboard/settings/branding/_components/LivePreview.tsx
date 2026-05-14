"use client";

import React from "react";
import { Button, RestaurantThemeProvider } from "@menu-bites/ui";
import { ChevronRight, Star, Clock, MapPin, Share2, Heart } from "lucide-react";

interface LivePreviewProps {
  currentTheme: any;
  sampleProduct: any;
}

/**
 * LivePreview
 * 
 * Mockup de alta fidelidad que reacciona en tiempo real a los cambios del ThemeProvider.
 * Simula la vista de un producto en el portal del cliente.
 */
export function LivePreview({ currentTheme, sampleProduct }: LivePreviewProps) {
  // Protección contra datos nulos durante la carga inicial o errores de fetch
  if (!sampleProduct) {
    return (
      <div className="sticky top-24 aspect-[9/16] w-full max-w-[320px] mx-auto bg-foreground/5 rounded-[3rem] border-[8px] border-foreground/10 flex items-center justify-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20">Cargando Preview...</p>
      </div>
    );
  }

  return (
    <div className="sticky top-24 space-y-6">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-lg font-black text-foreground uppercase italic tracking-tight">Simulación Live</h2>
          <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Vista previa del portal móvil</p>
        </div>
      </div>

      <div className="relative aspect-[9/16] w-full max-w-[320px] mx-auto bg-black rounded-[3rem] border-[8px] border-foreground/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Notch del simulador */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground/10 rounded-b-3xl z-50" />
        
        {/* Contenedor del ThemeProvider para la simulación */}
        <RestaurantThemeProvider theme={currentTheme}>
          <div 
            className="h-full flex flex-col p-8 space-y-8 relative z-10"
            style={{ 
              backgroundColor: currentTheme.backgroundColor,
              "--font-title":  `"${currentTheme.fontTitle || 'Outfit'}", sans-serif`,
              "--font-body": `"${currentTheme.fontBody || 'Outfit'}", sans-serif`,
              "--font-accent": `"${currentTheme.fontAccent || 'Outfit'}", sans-serif`
            } as any}
          >
            {/* Header del Mockup */}
            <div className="flex justify-between items-start pt-4">
              <div className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </div>
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-primary" />
                </div>
              </div>
            </div>

            {/* Imagen del Producto Mockup */}
            <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-2xl border border-foreground/10">
              <img 
                src={sampleProduct.image} 
                alt="Sample" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-primary px-3 py-1.5 rounded-full shadow-xl">
                 <p className="text-[10px] font-black text-primary-foreground uppercase tracking-widest">Popular</p>
              </div>
            </div>

            {/* Información del Producto */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black italic uppercase leading-none tracking-tight" style={{ fontFamily: "var(--font-title)", color: "hsl(var(--foreground))" }}>
                    {sampleProduct.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-3 h-3 text-primary fill-primary" />
                    <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">4.9 (120+ Reseñas)</span>
                  </div>
                </div>
                <p className="text-xl font-black text-primary italic" style={{ fontFamily: "var(--font-accent)" }}>
                  ${sampleProduct.price}
                </p>
              </div>

              <p className="text-xs font-medium text-foreground/60 leading-relaxed line-clamp-3" style={{ fontFamily: "var(--font-body)" }}>
                {sampleProduct.description}
              </p>
            </div>

            {/* Detalles Rápidos */}
            <div className="grid grid-cols-2 gap-3">
               <div className="p-4 rounded-3xl bg-foreground/5 border border-foreground/10 flex items-center gap-3">
                  <Clock className="w-4 h-4 text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-widest">20-30 min</p>
               </div>
               <div className="p-4 rounded-3xl bg-foreground/5 border border-foreground/10 flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-widest">1.2 km</p>
               </div>
            </div>

            {/* Botón de Acción */}
            <div className="mt-auto">
              <Button className="w-full h-16 rounded-[1.5rem] bg-primary text-primary-foreground font-black uppercase italic tracking-widest shadow-2xl shadow-primary/30">
                Añadir al Carrito
              </Button>
            </div>
          </div>
        </RestaurantThemeProvider>
        
        {/* Barra de Inicio del simulador */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-foreground/20 rounded-full z-50" />
      </div>
    </div>
  );
}
