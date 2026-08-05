import { z } from 'zod';

// Réplica byte-a-byte de api-pos/src/validators/producto.validator.ts (SPEC-016 §DESIGN) — campos
// monetarios/porcentuales viajan como string para preservar precisión decimal; el backend nunca
// recibe number. REQ-X7: bloquear localmente, mismo mensaje que el backend.
export const decimalPositivoSchema = z
  .union([z.string(), z.number()])
  .transform((val) => String(val))
  .refine((val) => /^\d+(\.\d{1,2})?$/.test(val) && parseFloat(val) >= 0, {
    message: 'Debe ser un número decimal no negativo (ej. "120.00")',
  });

export const margenPorcentajeSchema = z
  .union([z.string(), z.number()])
  .transform((val) => String(val))
  .refine((val) => /^\d+(\.\d{1,2})?$/.test(val) && parseFloat(val) >= 0 && parseFloat(val) < 100, {
    message: 'El margen no puede ser 100% o mayor (causaría precio infinito). Usa un valor entre 0 y 99.99.',
  });

export const descuentoPorcentajeSchema = z
  .union([z.string(), z.number()])
  .transform((val) => String(val))
  .refine((val) => /^\d+(\.\d{1,2})?$/.test(val) && parseFloat(val) >= 0 && parseFloat(val) <= 100, {
    message: 'El descuento debe estar entre 0 y 100.',
  });

// RESPUESTA-007-migracion-unidad-medida-fk.md (SPEC-016 v1.6.0) — `unidadMedida` (string enum) →
// `unidadMedidaId` (FK real a `UnidadMedida.id`, SPEC-021). Existencia y compatibilidad de `tipo` se
// validan en el backend (requiere consulta a BD, REQ-E13); aquí solo se valida la forma (uuid).
export const unidadMedidaIdSchema = z.string().uuid('Selecciona una unidad de medida válida.');
