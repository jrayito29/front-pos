import { z } from 'zod';

// Réplica de actualizarSucursalSchema (api-pos, SPEC-014). A diferencia de Categorías, no lleva
// `.refine(al menos un campo)`: SucursalInfoGeneralForm es un formulario completo (mismo patrón que
// ProductoInfoGeneralForm), siempre envía todos los campos precargados con los valores actuales, no
// una edición parcial de un subconjunto. Mismo criterio de `codigoSufijo`/`direccionCompleta`
// derivado que crearSucursal.schema.ts (REQ-U4/U5).
export const actualizarSucursalSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(120),
  codigoSufijo: z.string().max(16, 'Máximo 16 caracteres').optional(),
  telefono: z.string().max(15).optional(),
  email: z.union([z.literal(''), z.string().email('Email inválido')]).optional(),
  calle: z.string().min(1, 'La calle es requerida').max(120),
  numeroExterior: z.string().min(1, 'El número exterior es requerido').max(10),
  numeroInterior: z.string().max(10).optional(),
  colonia: z.string().min(1, 'La colonia es requerida').max(100),
  municipio: z.string().min(1, 'El municipio es requerido').max(80),
  estado: z.string().min(1, 'El estado es requerido').max(60),
  codigoPostal: z.string().length(5, 'El código postal debe tener exactamente 5 caracteres'),
});

export type ActualizarSucursalInput = z.input<typeof actualizarSucursalSchema>;
export type ActualizarSucursalOutput = z.output<typeof actualizarSucursalSchema>;
