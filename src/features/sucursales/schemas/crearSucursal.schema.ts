import { z } from 'zod';

// Réplica de crearSucursalSchema (api-pos/src/validators/sucursales.validator.ts, SPEC-014), con
// una diferencia deliberada: `codigoPersonalizable` se captura aquí como `codigoSufijo` (sin el
// prefijo "SUC-", ver SucursalCodigoInput/SPEC-012 REQ-U4) — el prefijo se concatena en el submit
// de `SucursalCrearForm`, nunca en este schema. `direccionCompleta` tampoco es un campo: es estado
// derivable (REQ-U5), se calcula con `buildDireccionCompleta` y se agrega al payload en el submit.
export const crearSucursalSchema = z.object({
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
  // REQ-U8 — Ventas/Mermas/Tránsito no son campos del formulario (siempre se crean); solo Reserva y
  // Apartados son elegibles por el usuario.
  incluirReserva: z.boolean().default(false),
  incluirApartados: z.boolean().default(false),
});

export type CrearSucursalInput = z.input<typeof crearSucursalSchema>;
export type CrearSucursalOutput = z.output<typeof crearSucursalSchema>;
