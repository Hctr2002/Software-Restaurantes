"use client";

import React, { useEffect } from "react";

export interface RestaurantTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  cardBackground: string;
  fontTitle?: string;
  fontBody?: string;
  fontAccent?: string;
  logoUrl?: string | null;
}

interface Props {
  theme?: RestaurantTheme;
  isGlobal?: boolean;
  children: React.ReactNode;
}

// Ajusta la luminosidad de un string HSL ("h s% l%") en ±delta puntos porcentuales
const adjustHslLightness = (hslStr: string, delta: number): string => {
  const [h, s, lRaw] = hslStr.split(' ');
  const l = Math.min(97, Math.max(3, parseInt(lRaw) + delta));
  return `${h} ${s} ${l}%`;
};

// Función para convertir colores hexadecimales a valores HSL puros
export const hexToHslValues = (hex: string) => {
  // Eliminar el # si existe
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
  
  // Expandir shorthand fff -> ffffff
  const fullHex = cleanHex.length === 3 
    ? cleanHex.split('').map(c => c + c).join('') 
    : cleanHex;

  const r = parseInt(fullHex.slice(0, 2), 16) / 255;
  const g = parseInt(fullHex.slice(2, 4), 16) / 255;
  const b = parseInt(fullHex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

// Componente proveedor para inyectar dinámicamente el branding del restaurante
export const RestaurantThemeProvider = ({ theme, children, isGlobal = false }: Props) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Efecto para aplicar los estilos cuando cambia el tema
  useEffect(() => {
    if (!theme) return;

    const target = isGlobal ? document.documentElement : containerRef.current;
    if (!target) return;

    try {
      const cardHsl = hexToHslValues(theme.cardBackground);
      const cardL   = parseInt(cardHsl.split(' ')[2]);
      // Muted: superficie sutil derivada del card (±6 puntos de luminosidad)
      const mutedHsl = adjustHslLightness(cardHsl, cardL > 50 ? -6 : 6);
      // Border: aún más sutil que muted (±10 puntos)
      const borderHsl = adjustHslLightness(cardHsl, cardL > 50 ? -10 : 10);
      // Muted-foreground: textColor atenuado (±20 puntos hacia el centro)
      const textHsl  = hexToHslValues(theme.textColor);
      const textL    = parseInt(textHsl.split(' ')[2]);
      const mutedFgHsl = adjustHslLightness(textHsl, textL > 50 ? -20 : 20);

      const colors = {
        "--primary": hexToHslValues(theme.primaryColor),
        "--secondary": hexToHslValues(theme.secondaryColor),
        "--background": hexToHslValues(theme.backgroundColor),
        "--accent": hexToHslValues(theme.accentColor),
        "--card": cardHsl,
        "--foreground": textHsl,
        // --- Tokens Derivados ---
        "--card-foreground": textHsl,
        "--primary-foreground": hexToHslValues(theme.backgroundColor),
        "--secondary-foreground": textHsl,
        "--accent-foreground": hexToHslValues(theme.backgroundColor),
        "--border":           borderHsl,
        "--input":            borderHsl,
        "--muted":            mutedHsl,
        "--muted-foreground": mutedFgHsl,
      };

      // Función para aplicar colores base y derivados al elemento objetivo (html o contenedor)
      Object.entries(colors).forEach(([key, val]) => {
        target.style.setProperty(key, val);
      });
      
      if (isGlobal) {
        // Aliases de compatibilidad con Tailwind 3/4
        const aliases: Record<string, string> = {
          "--navy-dark": colors["--background"],
          "--navy": colors["--card"],
          "--sand": colors["--foreground"],
          "--sage": colors["--primary"],
          "--brand-accent": colors["--accent"],
          // Tailwind 4 Prefixes (Requieren el wrapper hsl() completo)
          "--color-navy-dark": `hsl(${colors["--background"]})`,
          "--color-navy": `hsl(${colors["--card"]})`,
          "--color-sand": `hsl(${colors["--foreground"]})`,
          "--color-sage": `hsl(${colors["--primary"]})`,
          "--color-accent": `hsl(${colors["--accent"]})`,
          "--color-success": `hsl(160 84% 39%)`, // Emerald fixo por ahora o derivar si es necesario
          // Dashboards (Slate fallback)
          "--slate-950": colors["--background"],
          "--slate-900": colors["--card"],
          "--slate-800": colors["--secondary"],
          "--slate-300": colors["--foreground"],
          // Slate full colors for T4
          "--color-slate-950": `hsl(${colors["--background"]})`,
          "--color-slate-900": `hsl(${colors["--card"]})`,
          "--color-slate-800": `hsl(${colors["--secondary"]})`,
          "--color-slate-300": `hsl(${colors["--foreground"]})`,
        };

        // Función para aplicar alias de compatibilidad
        Object.entries(aliases).forEach(([key, val]) => {
          target.style.setProperty(key, val);
        });
      }
      
      // --- Carga Dinámica de Fuentes ---
      const fontsToLoad = [theme.fontTitle, theme.fontBody, theme.fontAccent].filter(Boolean) as string[];
      if (fontsToLoad.length > 0) {
        const linkId = "google-fonts-theme-dynamic";
        let link = document.getElementById(linkId) as HTMLLinkElement;
        
        if (!link) {
          link = document.createElement("link");
          link.id = linkId;
          link.rel = "stylesheet";
          document.head.appendChild(link);
        }
        
        // Función para construir la URL de Google Fonts y cargar las fuentes seleccionadas
        const fontParams = fontsToLoad
          .map(f => `family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900`)
          .join('&');
        
        link.href = `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;
      }
      // ---------------------------------
      
      // Función para actualizar variables de fuente (CSS Custom Properties en :root)
      // Se usan sufijos -stack para compatibilidad con Tailwind y variables limpias para herencia directa
      if (theme.fontTitle) {
        const titleStack = `"${theme.fontTitle}", system-ui, sans-serif`;
        target.style.setProperty("--font-title-stack", titleStack);
        target.style.setProperty("--font-title", titleStack);
        target.style.setProperty("--font-outfit", titleStack); // Alias de compatibilidad
      }
      if (theme.fontBody) {
        const bodyStack = `"${theme.fontBody}", system-ui, sans-serif`;
        target.style.setProperty("--font-body-stack", bodyStack);
        target.style.setProperty("--font-body", bodyStack);
        target.style.setProperty("--font-inter", bodyStack); // Alias de compatibilidad
      }
      if (theme.fontAccent) {
        const accentStack = `"${theme.fontAccent}", system-ui, sans-serif`;
        target.style.setProperty("--font-accent-stack", accentStack);
        target.style.setProperty("--font-accent", accentStack);
      }
    } catch (e) {
      console.error("Error setting theme properties:", e);
    }
  }, [theme, isGlobal]);

  if (isGlobal) return <>{children}</>;

  return (
    <div 
      ref={containerRef} 
      className="restaurant-theme-container"
      style={{ display: 'contents' }}
    >
      {children}
    </div>
  );
};
