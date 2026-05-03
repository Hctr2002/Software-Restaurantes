import { z } from "zod";

export const themeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  paletteName: z.string().optional(),
  isCustom: z.boolean().default(false),
  isActive: z.boolean().default(false),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color inválido"),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color inválido"),
  backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color inválido"),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color inválido"),
  textColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color inválido"),
  cardBackground: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color inválido"),
  fontTitle: z.string().default("Outfit"),
  fontBody: z.string().default("Inter"),
  logoUrl: z.string().url().nullable().optional(),
});

export type ThemeInput = z.infer<typeof themeSchema>;
