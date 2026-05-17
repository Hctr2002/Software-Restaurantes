/**
 * palettes — Paletas de marca predefinidas para el Carrusel de Inspiración del Laboratorio de Branding.
 * Cada plantilla incluye colores y tipografías listos para aplicar como tema del restaurante.
 */

export interface PaletteTemplate {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  cardBackground: string;
  fontTitle: string;
  fontBody: string;
  fontAccent: string;
}

export const PALETTE_TEMPLATES: PaletteTemplate[] = [
  {
    id: "fresh_harvest",
    name: "Huerta Orgánica",
    description: "Saludable · Vegetariano · Natural",
    primaryColor: "#25B16B",
    secondaryColor: "#06162B",
    backgroundColor: "#F9F5EF",
    accentColor: "#FFA729",
    textColor: "#06162B",
    cardBackground: "#FFFFFF",
    fontTitle: "Fraunces",
    fontBody: "DM Sans",
    fontAccent: "Caveat",
  },
  {
    id: "cyber_chef",
    name: "Neon Night Fusion",
    description: "Bar moderno · Coctelería · Concepto nocturno",
    primaryColor: "#B16BE0",
    secondaryColor: "#0D0A14",
    backgroundColor: "#0D0A14",
    accentColor: "#29D6E8",
    textColor: "#F0F6FC",
    cardBackground: "#1A1626",
    fontTitle: "Space Grotesk",
    fontBody: "Manrope",
    fontAccent: "JetBrains Mono",
  },
  {
    id: "gourmet",
    name: "Boutique Gastronomique",
    description: "Alta cocina · Lujo · Evento privado",
    primaryColor: "#C9A063",
    secondaryColor: "#1F2937",
    backgroundColor: "#0D1117",
    accentColor: "#FFFFFF",
    textColor: "#F0F6FC",
    cardBackground: "#161B22",
    fontTitle: "Playfair Display",
    fontBody: "Jost",
    fontAccent: "Cinzel",
  },
  {
    id: "seafood",
    name: "Brisa Marina",
    description: "Mariscos · Costero · Mediterráneo azul",
    primaryColor: "#0077B6",
    secondaryColor: "#90E0EF",
    backgroundColor: "#F0F7FF",
    accentColor: "#023E8A",
    textColor: "#03045E",
    cardBackground: "#FFFFFF",
    fontTitle: "Fraunces",
    fontBody: "Outfit",
    fontAccent: "Josefin Slab",
  },
  {
    id: "steakhouse",
    name: "Brasa & Linaje",
    description: "Parrilla · Carnes · Tradición de fuego",
    primaryColor: "#8B2635",
    secondaryColor: "#3E2723",
    backgroundColor: "#1A0F0A",
    accentColor: "#D4A373",
    textColor: "#FAEDCD",
    cardBackground: "#2B1D19",
    fontTitle: "Teko",
    fontBody: "Barlow",
    fontAccent: "Russo One",
  },
  {
    id: "burger",
    name: "Garage Burger",
    description: "Fast food · Casual · Comida rápida gourmet",
    primaryColor: "#E11D48",
    secondaryColor: "#FBBF24",
    backgroundColor: "#FFFFFF",
    accentColor: "#111827",
    textColor: "#111827",
    cardBackground: "#F9FAFB",
    fontTitle: "Bungee",
    fontBody: "Rubik",
    fontAccent: "Permanent Marker",
  },
  {
    id: "fusion_latina",
    name: "Tierra & Sabor",
    description: "Cocina latina · Vibrante · Sabor con carácter",
    primaryColor: "#C4622D",
    secondaryColor: "#1A1A1A",
    backgroundColor: "#FFFBF5",
    accentColor: "#F2C14E",
    textColor: "#1A1A1A",
    cardBackground: "#FFFFFF",
    fontTitle: "Bebas Neue",
    fontBody: "DM Sans",
    fontAccent: "Oswald",
  },
  {
    id: "zen",
    name: "Kyoto Minimalist",
    description: "Oriental · Japonés · Sushi · Ramen",
    primaryColor: "#C0392B",
    secondaryColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
    accentColor: "#999999",
    textColor: "#111111",
    cardBackground: "#F5F5F5",
    fontTitle: "Shippori Mincho",
    fontBody: "Inter",
    fontAccent: "Noto Serif JP",
  },
  {
    id: "pastry",
    name: "Petit Plaisir",
    description: "Pastelería · Dulcería · Café de autor",
    primaryColor: "#C855CB",
    secondaryColor: "#B3DEE2",
    backgroundColor: "#FFFAFB",
    accentColor: "#FBE7C6",
    textColor: "#4A4A4A",
    cardBackground: "#FFFFFF",
    fontTitle: "Quicksand",
    fontBody: "Nunito",
    fontAccent: "Josefin Sans",
  },
];
