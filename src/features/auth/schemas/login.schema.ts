import { z } from 'zod';

// Réplica byte-a-byte de loginSchema en api-pos/src/validators/auth.validator.ts — ver SPEC-002 REQ-U9.
// El login NO valida fuerza de contraseña (min/mayúscula/número): esa regla es exclusiva de registro/reset.
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
