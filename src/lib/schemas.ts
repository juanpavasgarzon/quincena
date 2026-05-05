import { z } from "zod";

export const periodHeaderSchema = z.object({
  period_label: z.string().min(1, "El período es requerido"),
  period_sub: z.string().optional(),
  income: z.number().positive("El ingreso debe ser mayor que cero"),
});

export const fixedItemSchema = z.object({
  label: z.string().min(1, "La descripción es requerida"),
  amount: z.number().positive("El monto debe ser mayor que cero"),
  frequency: z.enum(["monthly", "biweekly"]),
  is_active: z.boolean(),
});

export const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const magicLinkSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
});

export type PeriodHeaderFormData = z.infer<typeof periodHeaderSchema>;
export type FixedItemFormData = z.infer<typeof fixedItemSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type MagicLinkFormData = z.infer<typeof magicLinkSchema>;
