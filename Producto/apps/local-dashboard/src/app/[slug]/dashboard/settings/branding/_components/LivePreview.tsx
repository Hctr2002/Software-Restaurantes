/**
 * LivePreview — Simulación del portal móvil del cliente con el tema actualmente en edición.
 * Replica la estructura real del customer-portal para que el ADMIN vea el resultado final antes de guardar.
 */
"use client";

import React from "react";
import { getPublicImageUrl } from "@menu-bites/auth";
import { Plus, Search, ShoppingBag } from "lucide-react";

interface LivePreviewProps {
  currentTheme: any;
  sampleProduct: any;
}

const UI_FONT = "Inter, system-ui, sans-serif";

export function LivePreview({ currentTheme, sampleProduct }: LivePreviewProps) {
  if (!sampleProduct) {
    return (
      <div className="sticky top-24 aspect-[9/16] w-full max-w-[320px] mx-auto bg-foreground/5 rounded-[3rem] border-[8px] border-foreground/10 flex items-center justify-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20" style={{ fontFamily: UI_FONT }}>Cargando Preview...</p>
      </div>
    );
  }

  const imageUrl = getPublicImageUrl(sampleProduct.image_url ?? null);
  const titleFont  = `"${currentTheme.fontTitle}", sans-serif`;
  const bodyFont   = `"${currentTheme.fontBody}", sans-serif`;
  const accentFont = `"${currentTheme.fontAccent}", sans-serif`;

  const bg    = currentTheme.backgroundColor;
  const card  = currentTheme.cardBackground;
  const text  = currentTheme.textColor;
  const pri   = currentTheme.primaryColor;

  return (
    <div className="sticky top-24 space-y-4">
      <div className="px-2">
        <h2 className="text-lg font-black text-foreground uppercase italic tracking-tight" style={{ fontFamily: UI_FONT }}>Simulación Live</h2>
        <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest" style={{ fontFamily: UI_FONT }}>Vista previa del portal móvil</p>
      </div>

      {/* Marco del teléfono */}
      <div className="relative w-full max-w-[320px] mx-auto rounded-[3rem] border-[8px] border-foreground/20 shadow-2xl overflow-hidden bg-black" style={{ height: 620 }}>
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-2xl z-50" />

        {/* Pantalla */}
        <div className="h-full overflow-y-auto flex flex-col" style={{ backgroundColor: bg }}>

          {/* Header — réplica del portal real */}
          <div className="pt-6 px-4 pb-3 flex items-center justify-between shrink-0 border-b" style={{ borderColor: `${text}10`, backgroundColor: card }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: pri }}>
                <ShoppingBag className="w-3.5 h-3.5" style={{ color: bg }} />
              </div>
              <div>
                <p className="text-[10px] font-black italic uppercase leading-none" style={{ color: text, fontFamily: titleFont }}>
                  {sampleProduct.categories?.name ?? "Restaurante"}
                </p>
                <p className="text-[7px] font-bold uppercase tracking-widest opacity-40" style={{ color: text, fontFamily: UI_FONT }}>
                  En servicio · Mesa 1
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${text}08` }}>
                <Search className="w-3 h-3" style={{ color: text }} />
              </div>
            </div>
          </div>

          {/* Category tabs — réplica del portal */}
          <div className="flex gap-3 px-4 pt-3 pb-2 shrink-0 overflow-x-auto no-scrollbar">
            {["Carta completa", "Entrada", "Postre"].map((cat, i) => (
              <span
                key={cat}
                className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap pb-1 shrink-0"
                style={{
                  color: i === 0 ? pri : `${text}40`,
                  fontFamily: accentFont,
                  borderBottom: i === 0 ? `2px solid ${pri}` : "2px solid transparent",
                }}
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Section label */}
          <div className="px-4 py-2 shrink-0 flex items-center gap-2">
            <div className="w-0.5 h-3 rounded-full" style={{ backgroundColor: pri }} />
            <p className="text-[8px] font-black uppercase tracking-[0.2em]" style={{ color: text, fontFamily: titleFont, opacity: 0.5 }}>
              {sampleProduct.categories?.name ?? "Menú"}
            </p>
          </div>

          {/* Tarjetas — réplica exacta de PortalMenuItemCard */}
          <div className="px-3 pb-6 space-y-4">
            {[sampleProduct, sampleProduct].map((product, idx) => (
              <div
                key={idx}
                className="rounded-[1.5rem] border overflow-hidden shadow-lg flex flex-col"
                style={{ backgroundColor: card, borderColor: `${text}12` }}
              >
                {/* Imagen — h-44 en portal real, escalado al mockup */}
                <div className="relative overflow-hidden" style={{ height: 130, backgroundColor: `${text}06` }}>
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop";
                    }}
                  />
                </div>

                {/* Contenido — réplica de p-6 sm:p-8 del portal */}
                <div className="p-4 flex flex-col gap-2">
                  {/* Nombre + precio en la misma fila */}
                  <div className="flex justify-between items-start gap-2">
                    <h4
                      className="font-black leading-none tracking-tighter italic uppercase line-clamp-2 flex-1"
                      style={{ color: text, fontFamily: titleFont, fontSize: 13 }}
                    >
                      {product.name}
                    </h4>
                    <span
                      className="italic leading-none shrink-0 font-black"
                      style={{ color: pri, fontFamily: accentFont, fontSize: 13 }}
                    >
                      ${Number(product.price).toLocaleString("es-CL")}
                    </span>
                  </div>

                  {/* Descripción */}
                  <p
                    className="font-bold leading-relaxed line-clamp-2"
                    style={{ color: text, fontFamily: bodyFont, fontSize: 9, opacity: 0.4 }}
                  >
                    {product.description}
                  </p>

                  {/* Botón Añadir al Carrito — réplica del portal real */}
                  <button
                    className="mt-1 w-full flex items-center justify-center gap-1.5 font-black uppercase tracking-widest rounded-2xl shadow-lg"
                    style={{
                      backgroundColor: pri,
                      color: card,
                      fontFamily: bodyFont,
                      fontSize: 8,
                      paddingTop: 10,
                      paddingBottom: 10,
                    }}
                  >
                    <Plus className="w-2.5 h-2.5" />
                    Añadir al Carrito
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full z-50" style={{ backgroundColor: `${text}30` }} />
      </div>
    </div>
  );
}
