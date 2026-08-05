import { z } from 'zod';

// Réplica de actualizarCategoriaSchema (api-pos/src/validators/categorias.validator.ts, SPEC-020).
// `padreId` acepta `null` explícito (mueve la categoría a raíz) además de `undefined` (sin cambios) —
// a diferencia de `crearCategoriaSchema`, aquí sí hace falta distinguir ambos casos.
export const actualizarCategoriaSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es requerido').max(100).optional(),
    descripcion: z.string().max(255).optional(),
    padreId: z.string().uuid('Selecciona una categoría padre válida').nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Debes modificar al menos un campo' });

export type ActualizarCategoriaValues = z.infer<typeof actualizarCategoriaSchema>;
