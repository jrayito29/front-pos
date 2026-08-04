import { z } from 'zod';
import { UNIDADES_MEDIDA_KEYS } from '../constants/producto.constants';

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

export const unidadMedidaSchema = z.enum(UNIDADES_MEDIDA_KEYS as [string, ...string[]], {
  message: 'Selecciona una unidad de medida válida.',
});
