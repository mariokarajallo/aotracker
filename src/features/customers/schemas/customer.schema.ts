import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  whatsapp: z.string().min(6, "Ingresá un número de WhatsApp válido"),
  nationalId: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
