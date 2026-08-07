import { z } from 'zod';

// Réplica de actualizarAlmacenSchema (api-pos, SPEC-014). Usado por AlmacenFormModal en modo
// editar — `tipo` nunca es un campo (inmutable, se muestra como badge de solo lectura). Mismo
// criterio de dirección opcional que crearAlmacen.schema.ts.
export const actualizarAlmacenSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(120),
  // Sin `.min(1)` — mismo criterio que crearAlmacen.schema.ts.
  codigoPersonalizable: z.string().max(20).optional(),
  permitirVenta: z.boolean(),
  permitirTraspaso: z.boolean(),
  esVirtual: z.boolean(),
  calle: z.string().max(120).optional(),
  numeroExterior: z.string().max(10).optional(),
  numeroInterior: z.string().max(10).optional(),
  colonia: z.string().max(100).optional(),
  municipio: z.string().max(80).optional(),
  estado: z.string().max(60).optional(),
  codigoPostal: z.string().length(5, 'El código postal debe tener exactamente 5 caracteres').optional().or(z.literal('')),
});

export type ActualizarAlmacenInput = z.input<typeof actualizarAlmacenSchema>;
export type ActualizarAlmacenOutput = z.output<typeof actualizarAlmacenSchema>;
