import { z } from 'zod';

// Réplica de crearAlmacenSchema (api-pos/src/validators/almacenes.validator.ts, SPEC-014). Usado
// únicamente por AlmacenFormModal en modo crear (tipo fijo PERSONALIZADO, REQ-E7) — a diferencia de
// Sucursal, `codigoPersonalizable` de Almacén no exige prefijo (min 1, max 20, sin regex). La
// sección Dirección es opcional y colapsada por defecto: si el usuario no la completa, el backend
// hereda la dirección de la sucursal (SPEC-014 REQ-E8) — `direccionCompleta` solo se calcula y
// agrega al payload cuando al menos un campo de dirección tiene valor (ver AlmacenFormModal).
export const crearAlmacenSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(120),
  // Sin `.min(1)`: un `<input>` sin tocar llega como `''` vía RHF (nunca `undefined`), y `.min(1)`
  // rechazaría ese caso antes de que el payload builder pueda convertirlo a `undefined`.
  codigoPersonalizable: z.string().max(20).optional(),
  permitirVenta: z.boolean().default(false),
  permitirTraspaso: z.boolean().default(false),
  esVirtual: z.boolean().default(false),
  calle: z.string().max(120).optional(),
  numeroExterior: z.string().max(10).optional(),
  numeroInterior: z.string().max(10).optional(),
  colonia: z.string().max(100).optional(),
  municipio: z.string().max(80).optional(),
  estado: z.string().max(60).optional(),
  codigoPostal: z.string().length(5, 'El código postal debe tener exactamente 5 caracteres').optional().or(z.literal('')),
});

export type CrearAlmacenInput = z.input<typeof crearAlmacenSchema>;
export type CrearAlmacenOutput = z.output<typeof crearAlmacenSchema>;
