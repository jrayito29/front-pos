import { z } from 'zod';
import { decimalPositivoSchema, margenPorcentajeSchema } from './shared.schema';

// Réplica de ajustarCostoSchema (SPEC-016) — REQ-U28, formulario "Ajustar costo" del tab Costos y precio.
export const ajustarCostoSchema = z.object({
  costoEstimado: decimalPositivoSchema,
  costoPromedio: decimalPositivoSchema.optional(),
  precioVenta: decimalPositivoSchema,
  margenDeseadoPorcentaje: margenPorcentajeSchema.optional(),
});

// Ver nota de crearProducto.schema.ts sobre Input/Output y `.transform()`.
export type AjustarCostoInput = z.input<typeof ajustarCostoSchema>;
export type AjustarCostoOutput = z.output<typeof ajustarCostoSchema>;
