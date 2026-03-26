import { z } from "zod";

export const productSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
  description: z.string().min(2, "La descripción debe tener al menos 2 caracteres"),
  brand: z.string().optional(),
  size: z.string().optional(),
  costPrice: z.coerce.number().positive("El precio de costo debe ser mayor a 0"),
  salePrice: z.coerce.number().positive("El precio de venta debe ser mayor a 0"),
}).refine((data) => data.salePrice > data.costPrice, {
  message: "El precio de venta debe ser mayor al precio de costo",
  path: ["salePrice"],
});

export type ProductFormValues = z.infer<typeof productSchema>;
