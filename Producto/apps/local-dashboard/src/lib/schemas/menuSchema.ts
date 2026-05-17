/**
 * menuSchema — Esquema de validación Zod para ítems del menú.
 * Usado en las rutas API POST/PUT /api/local/menu y /api/local/menu/[id].
 */
import { z } from "zod";

export const menuSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().nullable().optional(),
  price: z.number().min(0, "el precio debe ser mayor o igual a 0"),
  is_active: z.boolean().default(true),
  category_id: z.string().uuid("ID de categoría inválido"),
  image_url: z.string().url().nullable().optional(),
});

export type MenuInput = z.infer<typeof menuSchema>;
