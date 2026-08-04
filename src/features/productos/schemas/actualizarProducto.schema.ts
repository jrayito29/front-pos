import { z } from 'zod';
import { decimalPositivoSchema, margenPorcentajeSchema, descuentoPorcentajeSchema, unidadMedidaSchema } from './shared.schema';

// Réplica de actualizarProductoSchema (SPEC-016) — `tipo` es inmutable, se omite (REQ-U34). Los
// campos exclusivos de FISICO se ocultan en la UI cuando tipo=SERVICIO (REQ-S5), así que este schema
// no necesita el `.superRefine` de rechazo que sí tiene `crearProductoSchema` — en edición el
// backend los ignora con advertencia en vez de rechazarlos (SPEC-016 REQ-E12).
export const actualizarProductoSchema = z.object({
  sku: z.string().max(50).optional(),
  codigoBarras: z.string().max(100).optional(),
  nombreCorto: z.string().min(1, 'El nombre corto es requerido').max(60).optional(),
  nombreLargo: z.string().min(1, 'El nombre largo es requerido').max(255).optional(),
  categoriaId: z.string().uuid('Selecciona una categoría válida').optional(),
  subcategoriaId: z.string().uuid().optional(),
  unidadMedida: unidadMedidaSchema.optional(),
  requiereBascula: z.boolean().optional(),
  costoEstimado: decimalPositivoSchema.optional(),
  stockMinimo: z.number().int().min(0).optional(),
  margenDeseadoPorcentaje: margenPorcentajeSchema.optional(),
  precioVenta: decimalPositivoSchema.optional(),
  descuentoPorcentaje: descuentoPorcentajeSchema.optional(),
});

// Ver nota de crearProducto.schema.ts sobre Input/Output y `.transform()`.
export type ActualizarProductoInput = z.input<typeof actualizarProductoSchema>;
export type ActualizarProductoOutput = z.output<typeof actualizarProductoSchema>;
