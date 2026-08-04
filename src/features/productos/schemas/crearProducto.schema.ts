import { z } from 'zod';
import { TIPO_PRODUCTO } from '../constants/producto.constants';
import { decimalPositivoSchema, margenPorcentajeSchema, descuentoPorcentajeSchema, unidadMedidaSchema } from './shared.schema';

// Réplica de crearProductoSchema (api-pos/src/validators/producto.validator.ts, SPEC-016). REQ-U19.
export const crearProductoSchema = z
  .object({
    sku: z.string().max(50).optional(),
    codigoBarras: z.string().max(100).optional(),
    nombreCorto: z.string().min(1, 'El nombre corto es requerido').max(60),
    nombreLargo: z.string().min(1, 'El nombre largo es requerido').max(255),
    tipo: z.enum([TIPO_PRODUCTO.FISICO, TIPO_PRODUCTO.SERVICIO]),
    categoriaId: z.string().uuid('Selecciona una categoría válida').optional(),
    subcategoriaId: z.string().uuid().optional(),
    unidadMedida: unidadMedidaSchema.optional(),
    requiereBascula: z.boolean().default(false).optional(),
    costoEstimado: decimalPositivoSchema.default('0.00'),
    stockMinimo: z.number().int().min(0).optional(),
    margenDeseadoPorcentaje: margenPorcentajeSchema.optional(),
    precioVenta: decimalPositivoSchema.default('0.00'),
    descuentoPorcentaje: descuentoPorcentajeSchema.optional(),
  })
  .superRefine((data, ctx) => {
    // REQ-U46 — categoriaId es requerido a nivel de UX/negocio del front (el backend lo mantiene
    // opcional, SPEC-016, porque todavía no hay módulo real de Categorías con FK). Vive en
    // `superRefine` (no `.min(1)` directo en el campo) para no romper el tipo `string | undefined`
    // que espera `<Select>` como prop controlada.
    if (!data.categoriaId) {
      ctx.addIssue({ code: 'custom', path: ['categoriaId'], message: 'La categoría es requerida.' });
    }
    // REQ-U22 — la UI ya oculta estos campos cuando tipo=SERVICIO; esta regla se mantiene como
    // defensa en profundidad (mismo criterio que el backend, SPEC-016 REQ-X4/X11).
    if (data.tipo === TIPO_PRODUCTO.SERVICIO) {
      if (data.stockMinimo !== undefined) {
        ctx.addIssue({ code: 'custom', path: ['stockMinimo'], message: 'stockMinimo solo aplica a productos tipo FISICO.' });
      }
      if (data.unidadMedida !== undefined) {
        ctx.addIssue({ code: 'custom', path: ['unidadMedida'], message: 'unidadMedida solo aplica a productos tipo FISICO.' });
      }
      if (data.codigoBarras !== undefined) {
        ctx.addIssue({ code: 'custom', path: ['codigoBarras'], message: 'codigoBarras solo aplica a productos tipo FISICO.' });
      }
      if (data.requiereBascula === true) {
        ctx.addIssue({ code: 'custom', path: ['requiereBascula'], message: 'requiereBascula solo aplica a productos tipo FISICO.' });
      }
    }
  });

// Los campos decimales (`decimalPositivoSchema`/`margenPorcentajeSchema`/`descuentoPorcentajeSchema`)
// usan `.transform()` para normalizar string|number → string — el tipo que React Hook Form registra
// en los inputs (`Input`, antes del submit) difiere del que produce el resolver al validar
// (`Output`, después del `.transform()`). `useForm` debe tipar con `Input` y el handler de submit con
// `Output`; usar solo `z.infer` (=Output) rompe la firma del `Resolver` de zodResolver.
export type CrearProductoInput = z.input<typeof crearProductoSchema>;
export type CrearProductoOutput = z.output<typeof crearProductoSchema>;
