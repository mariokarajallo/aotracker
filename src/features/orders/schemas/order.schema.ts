import { z } from "zod";

export const newOrderSchema = z.object({
  customerId: z.string().min(1, "Seleccioná una clienta"),
  customerName: z.string().min(1),
  notes: z.string().optional(),
});

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  code: z.string().min(1),
  description: z.string().min(1),
  size: z.string().optional(),
  salePrice: z.coerce.number().positive(),
  deliveredQty: z.coerce.number().int().positive(),
});

export type NewOrderFormValues = z.infer<typeof newOrderSchema>;
export type OrderItemFormValues = z.infer<typeof orderItemSchema>;
