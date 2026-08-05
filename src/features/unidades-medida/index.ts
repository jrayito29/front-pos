// Barrel de la feature Unidades de Medida — expone únicamente lo que otras features (Productos)
// necesitan consumir (CLAUDE.md §3). Catálogo global de solo lectura, sin componentes de UI propios
// (a diferencia de Categorías, no hay registro rápido — SPEC-021 no expone escritura vía API).
export { useUnidadesMedida } from './hooks/useUnidadesMedida';
export { TIPO_UNIDAD_MEDIDA } from './constants/unidadMedida.constants';
export type { TipoUnidadMedidaDomain } from './constants/unidadMedida.constants';
export type { UnidadMedidaDTO } from './types/unidadMedida.types';
