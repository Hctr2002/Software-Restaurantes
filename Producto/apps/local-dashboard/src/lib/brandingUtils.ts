/**
 * Utilidades para el Laboratorio de Branding
 * Estos helpers gestionan la conversión y manipulación de colores y estilos.
 */

/**
 * Convierte un color Hexadecimal (#RRGGBB) a una cadena de valores HSL compatibles con Tailwind.
 * @param hex - Color en formato hexadecimal.
 * @returns Cadena con valores HSL separados por espacios (ej: "220 90% 50%").
 */
export function hexToHslValues(hex: string): string {
  if (!hex) return "0 0% 0%";
  
  // Limpiamos el hash si existe
  hex = hex.replace("#", "");
  
  // Convertimos a valores RGB (0-1)
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // Acromático (gris)
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Devolvemos los valores redondeados para CSS
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Inyecta dinámicamente las etiquetas <link> de Google Fonts en el <head> del documento.
 * @param titleFont - Fuente para títulos.
 * @param bodyFont - Fuente para cuerpo de texto.
 * @param accentFont - Fuente para acentos y navegación.
 */
export function loadGoogleFonts(titleFont: string, bodyFont: string, accentFont?: string) {
  const toLoad = [titleFont, bodyFont, accentFont].filter(f => f && f !== "system-ui");
  if (toLoad.length === 0) return;
  
  const existing = document.getElementById("branding-google-fonts");
  if (existing) existing.remove();
  
  const families = toLoad
    .map(f => `family=${encodeURIComponent(f as string)}:wght@300;400;500;600;700;800;900`)
    .join("&");
    
  const link = document.createElement("link");
  link.id = "branding-google-fonts";
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  document.head.appendChild(link);
}
