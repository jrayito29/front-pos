// DTOs del módulo de Unidades de Medida. Espejo 1:1 de api-pos/src/interfaces/unidad-medida.interfaces.ts
// (SPEC-021) — no se importan directamente, proyectos separados.
import type { TipoUnidadMedidaDomain } from '../constants/unidadMedida.constants';

export interface UnidadMedidaDTO {
  id: string;
  claveSat: string;
  nombre: string;
  abreviatura: string;
  tipo: TipoUnidadMedidaDomain;
}

export interface ListarUnidadesMedidaParams {
  tipo?: TipoUnidadMedidaDomain;
}
