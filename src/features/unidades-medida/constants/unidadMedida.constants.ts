// Espejo 1:1 de api-pos/src/constants/unidad-medida.constants.ts (SPEC-021).

export const TIPO_UNIDAD_MEDIDA = {
  PRODUCTO: 'PRODUCTO',
  SERVICIO: 'SERVICIO',
  AMBOS: 'AMBOS',
} as const;
export type TipoUnidadMedidaDomain = (typeof TIPO_UNIDAD_MEDIDA)[keyof typeof TIPO_UNIDAD_MEDIDA];
