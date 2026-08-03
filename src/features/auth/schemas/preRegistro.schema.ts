import { z } from 'zod';

// Réplica byte-a-byte de preRegistroSchema en api-pos/src/validators/auth.validator.ts — ver SPEC-003 REQ-U6.
// El formulario no incluye `planId` (decisión de producto): siempre se omite, el backend auto-asigna
// el plan de prueba al completar el perfil.
const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
  .regex(/[0-9]/, 'La contraseña debe contener al menos un número');

export const preRegistroSchema = z.object({
  email: z.string().email('Email inválido'),
  password: passwordSchema,
});

export type PreRegistroFormValues = z.infer<typeof preRegistroSchema>;
