"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import LocalShell from "../../_components/LocalShell";
import { Card, Button, Input } from "@menu-bites/ui";
import { PALETTE_TEMPLATES, PaletteTemplate } from "@/lib/constants/palettes";
import { Palette, Save, Check, Type, Image as ImageIcon, Trash2, Plus } from "lucide-react";
import { RestaurantThemeProvider, hexToHslValues } from "@menu-bites/ui";

const TITLE_FONTS = [
  { value: "Playfair Display", label: "Playfair Display — Alta Cocina" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond — Lujo Clásico" },
  { value: "Cinzel", label: "Cinzel — Gourmet Premium" },
  { value: "Outfit", label: "Outfit — Moderno Display" },
  { value: "Josefin Sans", label: "Josefin Sans — Minimalista" },
  { value: "Montserrat", label: "Montserrat — Contemporáneo" },
  { value: "Raleway", label: "Raleway — Elegante Light" },
  { value: "Bebas Neue", label: "Bebas Neue — Urban Bold" },
  { value: "Abril Fatface", label: "Abril Fatface — Bistró" },
  { value: "Roboto", label: "Roboto — Clásico" },
];

const BODY_FONTS = [
  { value: "Inter", label: "Inter — Recomendada" },
  { value: "Lato", label: "Lato — Limpio Moderno" },
  { value: "Nunito", label: "Nunito — Amigable" },
  { value: "Poppins", label: "Poppins — Geométrico" },
  { value: "DM Sans", label: "DM Sans — Contemporáneo" },
  { value: "Barlow", label: "Barlow — Versátil" },
  { value: "Source Sans 3", label: "Source Sans 3 — Legible" },
  { value: "Outfit", label: "Outfit — Display" },
  { value: "Roboto", label: "Roboto — Clásico" },
  { value: "system-ui", label: "Sistema — Sin descarga" },
];

function loadGoogleFonts(titleFont: string, bodyFont: string) {
  const toLoad = [titleFont, bodyFont].filter(f => f && f !== "system-ui");
  if (toLoad.length === 0) return;
  const existing = document.getElementById("branding-google-fonts");
  if (existing) existing.remove();
  const families = toLoad
    .map(f => `family=${encodeURIComponent(f)}:wght@300;400;600;700;800;900`)
    .join("&");
  const link = document.createElement("link");
  link.id = "branding-google-fonts";
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  document.head.appendChild(link);
}

export default function BrandingPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [themes, setThemes] = useState<any[]>([]);
  const [activeTheme, setActiveTheme] = useState<any>(null);
  const [currentTheme, setCurrentTheme] = useState<any>(PALETTE_TEMPLATES[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [customName, setCustomName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sampleProduct, setSampleProduct] = useState<any>(null);

  useEffect(() => {
    fetchThemes();
  }, [slug]);

  const fetchThemes = async () => {
    try {
      const res = await fetch("/api/local/theme");
      const { data } = await res.json();
      setThemes(data || []);
      const active = data?.find((t: any) => t.is_active);
      if (active) {
        setActiveTheme(active);
        // Map database fields to our internal format
        setCurrentTheme({
          primaryColor: active.primary_color,
          secondaryColor: active.secondary_color,
          backgroundColor: active.background_color,
          accentColor: active.accent_color,
          textColor: active.text_color,
          cardBackground: active.card_background,
          fontTitle: active.font_title,
          fontBody: active.font_body,
          paletteName: active.palette_name,
        });
      }
    } catch (error) {
      console.error("Error fetching themes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSampleProduct = async () => {
    try {
      const res = await fetch("/api/local/menu");
      const { data } = await res.json();
      if (data && data.length > 0) {
        // Buscamos uno que tenga imagen primero
        const withImage = data.find((p: any) => p.image_url);
        setSampleProduct(withImage || data[0]);
      }
    } catch (error) {
      console.error("Error fetching sample product:", error);
    }
  };

  useEffect(() => {
    fetchSampleProduct();
  }, [slug]);

  // Carga dinámica de Google Fonts cuando cambia la selección de tipografía
  useEffect(() => {
    loadGoogleFonts(
      currentTheme.fontTitle || "Outfit",
      currentTheme.fontBody  || "Inter"
    );
  }, [currentTheme.fontTitle, currentTheme.fontBody]);

  const handleApplyTemplate = (template: PaletteTemplate) => {
    setCurrentTheme({ ...template });
  };

  const handleSaveTheme = async (isNew = false) => {
    if (isNew && !customName) {
      alert("Por favor ingresa un nombre para el tema personalizado");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: isNew ? customName : (currentTheme.name || "Tema Personalizado"),
        paletteName: currentTheme.id || currentTheme.paletteName,
        isCustom: isNew,
        isActive: true,
        primaryColor: currentTheme.primaryColor,
        secondaryColor: currentTheme.secondaryColor,
        backgroundColor: currentTheme.backgroundColor,
        accentColor: currentTheme.accentColor,
        textColor: currentTheme.textColor,
        cardBackground: currentTheme.cardBackground,
        fontTitle: currentTheme.fontTitle || "Outfit",
        fontBody: currentTheme.fontBody || "Inter",
      };

      const res = await fetch("/api/local/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setCustomName("");
        await fetchThemes();
        window.dispatchEvent(new Event("theme-updated"));
      }
    } catch (error) {
      console.error("Error saving theme:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async (themeId: string) => {
    try {
      const res = await fetch("/api/local/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId, action: "activate" }),
      });
      if (res.ok) {
        await fetchThemes();
        window.dispatchEvent(new Event("theme-updated"));
      }
    } catch (error) {
      console.error("Error activating theme:", error);
    }
  };

  const handleDeleteTheme = async (id: string) => {
    try {
      const res = await fetch(`/api/local/theme?themeId=${id}`, { method: "DELETE" });
      if (res.ok) {
        if (activeTheme?.id === id) setActiveTheme(null);
        await fetchThemes();
      }
    } catch (error) {
      console.error("Error deleting theme:", error);
    }
  };

  const handleInitializeLibrary = async () => {
    try {
      const existingNames = themes.map(t => t.name);
      const toInsert = PALETTE_TEMPLATES.filter(p => !existingNames.includes(p.name));
      
      if (toInsert.length === 0) return;

      for (const template of toInsert) {
        await fetch("/api/local/theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: template.name,
            paletteName: template.id,
            isCustom: false,
            isActive: false,
            primaryColor: template.primaryColor,
            secondaryColor: template.secondaryColor,
            backgroundColor: template.backgroundColor,
            accentColor: template.accentColor,
            textColor: template.textColor,
            cardBackground: template.cardBackground,
            fontTitle: "Outfit",
            fontBody: "Inter"
          }),
        });
      }
      await fetchThemes();
    } catch (error) {
      console.error("Error initializing library:", error);
    }
  };

  if (isLoading) return <LocalShell title="Configuración" subtitle="Cargando..."><div>Cargando ajustes de marca...</div></LocalShell>;

  return (
    <LocalShell title="Configuración" subtitle="Personalización de Marca">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Templates Section */}
          <section className="p-6 rounded-2xl bg-card border border-white/5 space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Templates de Negocio</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PALETTE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleApplyTemplate(template)}
                  className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-95 ${
                    currentTheme.id === template.id || currentTheme.paletteName === template.id
                      ? "border-primary/70 bg-primary/10 shadow-lg shadow-primary/20"
                      : "border-white/5 bg-background/60 hover:border-white/10 hover:bg-background"
                  }`}
                >
                  <div className="flex gap-1 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: template.primaryColor }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: template.backgroundColor }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: template.accentColor }} />
                  </div>
                  <p className="text-xs font-bold text-foreground truncate">{template.name}</p>
                  <p className="text-[10px] text-foreground/40 truncate">{template.description}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Library Section */}
          {themes.length > 0 && (
            <section className="p-6 rounded-2xl bg-card border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Save className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-lg font-bold text-foreground">Biblioteca de Temas</h2>
                </div>
                {themes.length < PALETTE_TEMPLATES.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleInitializeLibrary}
                    className="text-[10px] uppercase tracking-widest font-bold text-primary hover:bg-primary/10"
                  >
                    Sincronizar Biblioteca
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {themes.map((theme) => (
                  <div
                    key={theme.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      theme.is_active
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-white/5 bg-background/60 hover:border-white/10"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-foreground">{theme.name}</p>
                      <p className="text-[10px] text-foreground/40">
                        {theme.is_active ? "Activo ahora" : `Creado el ${new Date(theme.created_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!theme.is_active && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px] border-white/10 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30"
                            onClick={() => handleActivate(theme.id)}
                          >
                            Activar
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-foreground/30 hover:text-red-400 hover:bg-red-400/10"
                            onClick={() => handleDeleteTheme(theme.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {theme.is_active && <Check className="w-4 h-4 text-emerald-500 mr-2" />}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Customization Section */}
          <section className="p-6 rounded-2xl bg-card border border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Personalización Avanzada</h2>
              <div className="flex gap-2">
                <div className="flex items-center bg-background rounded-lg p-1 border border-white/5">
                  <Input 
                    placeholder="Nombre del tema..." 
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="h-8 bg-transparent border-none text-xs w-40"
                  />
                  <Button 
                    size="sm" 
                    className="h-8 text-[10px]"
                    onClick={() => handleSaveTheme(true)}
                    disabled={isSaving}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Nueva Biblioteca
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ColorInput label="Primario (Marca)" value={currentTheme.primaryColor} onChange={(c) => setCurrentTheme({...currentTheme, primaryColor: c, id: null})} />
              <ColorInput label="Secundario" value={currentTheme.secondaryColor} onChange={(c) => setCurrentTheme({...currentTheme, secondaryColor: c, id: null})} />
              <ColorInput label="Acento (Acción)" value={currentTheme.accentColor} onChange={(c) => setCurrentTheme({...currentTheme, accentColor: c, id: null})} />
              <ColorInput label="Fondo" value={currentTheme.backgroundColor} onChange={(c) => setCurrentTheme({...currentTheme, backgroundColor: c, id: null})} />
              <ColorInput label="Texto" value={currentTheme.textColor} onChange={(c) => setCurrentTheme({...currentTheme, textColor: c, id: null})} />
              <ColorInput label="Tarjetas" value={currentTheme.cardBackground} onChange={(c) => setCurrentTheme({...currentTheme, cardBackground: c, id: null})} />
            </div>

            <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest flex items-center gap-1">
                  <Type className="w-3 h-3" /> Títulos
                </label>
                <select
                  value={currentTheme.fontTitle || "Outfit"}
                  onChange={(e) => setCurrentTheme({...currentTheme, fontTitle: e.target.value})}
                  className="w-full bg-background border border-white/10 rounded-lg h-10 px-3 text-sm text-foreground outline-none focus:border-primary/50"
                  style={{ fontFamily: `"${currentTheme.fontTitle || 'Outfit'}", sans-serif` }}
                >
                  {TITLE_FONTS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest flex items-center gap-1">
                  <Type className="w-3 h-3" /> Cuerpo
                </label>
                <select
                  value={currentTheme.fontBody || "Inter"}
                  onChange={(e) => setCurrentTheme({...currentTheme, fontBody: e.target.value})}
                  className="w-full bg-background border border-white/10 rounded-lg h-10 px-3 text-sm text-foreground outline-none focus:border-primary/50"
                  style={{ fontFamily: `"${currentTheme.fontBody || 'Inter'}", sans-serif` }}
                >
                  {BODY_FONTS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => fetchThemes()}
                className="border-white/10 text-foreground/50 hover:text-foreground"
              >
                Cancelar
              </Button>
              <Button 
                size="lg"
                onClick={() => handleSaveTheme(false)}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 shadow-[0_0_30px_rgba(37,99,235,0.5)]"
              >
                {isSaving ? "Guardando..." : "ACEPTAR Y APLICAR MARCA"}
              </Button>
            </div>
          </section>
        </div>

        {/* Right Column: Real-time Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Vista Previa (Customer Portal)</h2>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">LIVE PREVIEW</span>
            </div>
            
            <RestaurantThemeProvider theme={currentTheme}>
              <div 
                className="rounded-[2.5rem] border-8 border-slate-900 shadow-2xl overflow-hidden aspect-[9/16] relative transition-all duration-500"
                style={{
                  backgroundColor: `hsl(${hexToHslValues(currentTheme.backgroundColor)})`,
                  "--primary":    hexToHslValues(currentTheme.primaryColor),
                  "--secondary":  hexToHslValues(currentTheme.secondaryColor),
                  "--background": hexToHslValues(currentTheme.backgroundColor),
                  "--accent":     hexToHslValues(currentTheme.accentColor),
                  "--card":       hexToHslValues(currentTheme.cardBackground),
                  "--foreground": hexToHslValues(currentTheme.textColor),
                  "--font-outfit": `"${currentTheme.fontTitle || 'Outfit'}", sans-serif`,
                  "--font-inter":  `"${currentTheme.fontBody  || 'Inter'}",  sans-serif`,
                  "--font-title":  `"${currentTheme.fontTitle || 'Outfit'}", sans-serif`,
                  "--font-body":   `"${currentTheme.fontBody  || 'Inter'}",  sans-serif`,
                } as any}
              >
                {/* Degradados de fondo con acento y secundario — Usamos valores directos para máxima compatibilidad */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 0% 0%, hsl(var(--primary)) 0%, transparent 50%), radial-gradient(circle at 100% 100%, hsl(var(--accent)) 0%, transparent 50%)` }} />
                
                <div className="p-8 space-y-8 relative z-10">
                  {/* Header con Logo o Inicial */}
                  <div className="flex justify-between items-center">
                    <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--card))] flex items-center justify-center border border-[hsl(var(--primary))]/20 shadow-lg overflow-hidden">
                      {currentTheme.logoUrl ? (
                        <img src={currentTheme.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6" style={{ color: "hsl(var(--primary))" }} />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="w-10 h-10 rounded-xl bg-[hsl(var(--card))] border border-white/5 flex items-center justify-center relative">
                        <div className="w-5 h-5 rounded-lg opacity-20" style={{ backgroundColor: "hsl(var(--secondary))" }} />
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(var(--accent))" }} />
                      </div>
                    </div>
                  </div>
 
                  {/* Hero Text */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: "hsl(var(--secondary))" }}>RECOMENDADO</span>
                    <h1 className="text-4xl font-black leading-tight" style={{ fontFamily: "var(--font-title)", color: "hsl(var(--foreground))" }}>
                      Sabores <br/>
                      <span style={{ color: "hsl(var(--primary))" }}>Únicos</span>
                    </h1>
                    <p className="text-sm font-medium opacity-60" style={{ fontFamily: "var(--font-body)", color: "hsl(var(--foreground))" }}>
                      Experiencia gastronómica personalizada.
                    </p>
                  </div>
 
                  {/* Product Card */}
                  <div 
                    className="p-5 rounded-[2rem] border border-white/10 shadow-2xl transition-all duration-500"
                    style={{ backgroundColor: "hsl(var(--card))" }}
                  >
                    <div className="flex gap-4 items-center">
                        <div className="w-24 h-24 rounded-3xl bg-[hsl(var(--background))] border border-white/5 overflow-hidden flex items-center justify-center relative shadow-inner">
                          {sampleProduct?.image_url ? (
                            <img src={sampleProduct.image_url} alt="Product" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full opacity-10 flex items-center justify-center" style={{ backgroundColor: "hsl(var(--primary))" }}>
                              <ImageIcon className="w-8 h-8" />
                            </div>
                          )}
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[hsl(var(--card))] shadow-lg" style={{ backgroundColor: "hsl(var(--accent))" }} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h3 className="font-bold text-lg leading-tight" style={{ fontFamily: "var(--font-title)", color: "hsl(var(--foreground))" }}>
                            {sampleProduct?.name || "Cargando plato..."}
                          </h3>
                          <p className="text-[10px] opacity-60 line-clamp-2" style={{ fontFamily: "var(--font-body)", color: "hsl(var(--foreground))" }}>
                            {sampleProduct?.description || "Lo mejor de nuestra cocina"}
                          </p>
                          <div className="flex justify-between items-center pt-2">
                            <span className="font-black text-xl" style={{ color: "hsl(var(--primary))" }}>
                              {sampleProduct?.price ? `$${new Intl.NumberFormat("es-CL").format(sampleProduct.price)}` : "$0"}
                            </span>
                            <span className="text-[9px] px-2 py-1 rounded-lg font-bold uppercase tracking-tighter" style={{ backgroundColor: "hsl(var(--secondary))", color: "hsl(var(--background))" }}>
                              TOP
                            </span>
                          </div>
                        </div>
                      </div>
                      <button 
                        className="w-full mt-5 h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2"
                        style={{ 
                          backgroundColor: "hsl(var(--accent))", 
                          color: `hsl(${hexToHslValues(currentTheme.backgroundColor)})` 
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Pedir Ahora
                      </button>
                    </div>

                  <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                    {["Entradas", "Fondos", "Postres", "Vinos"].map((cat, i) => (
                      <div 
                        key={cat} 
                        className={`px-4 py-2 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all duration-500 ${i === 0 ? "shadow-lg scale-110" : "opacity-40"}`}
                        style={{ 
                          backgroundColor: i === 0 ? "hsl(var(--primary))" : "transparent",
                          borderColor: i === 0 ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                          color: i === 0 ? "hsl(var(--background))" : "hsl(var(--foreground))"
                        }}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </RestaurantThemeProvider>
          </div>
        </div>
      </div>
    </LocalShell>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer overflow-hidden p-0"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 bg-background border-white/10 text-xs font-mono"
        />
      </div>
    </div>
  );
}
