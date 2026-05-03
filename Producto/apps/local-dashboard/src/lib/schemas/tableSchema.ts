import { z } from "zod";

export const tableSchema = z.object({
  number: z.number().int().positive("El número de mesa debe ser positivo"),
  label: z.string().nullable().optional(),
  status: z.enum(["FREE", "OCCUPIED", "RESERVED"]).default("FREE"),
});

export type TableInput = z.infer<typeof tableSchema>;
