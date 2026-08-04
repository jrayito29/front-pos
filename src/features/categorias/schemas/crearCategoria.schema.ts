import { z } from 'zod';

// Réplica de crearCategoriaSchema (api-pos/src/validators/categorias.validator.ts, SPEC-020). Sin
// campos `.transform()` — a diferencia de los schemas de Productos, aquí Input y Output coinciden,
// no hace falta la separación z.input/z.output.
export const crearCategoriaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  descripcion: z.string().max(255).optional(),
  padreId: z.string().uuid('Selecciona una categoría padre válida').optional(),
});

export type CrearCategoriaValues = z.infer<typeof crearCategoriaSchema>;
