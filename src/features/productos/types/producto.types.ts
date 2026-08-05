// DTOs del módulo de Productos. Ref: SPEC-009, espejo 1:1 de api-pos/src/interfaces/producto.interfaces.ts
// (no se importan directamente — proyectos separados, mismo criterio que features/auth/types).
import type { TipoProductoDomain, EstadoProductoDomain, FuentePrecioDomain } from '../constants/producto.constants';
import type { UnidadMedidaDTO } from '../../unidades-medida';

// RESPUESTA-007-migracion-unidad-medida-fk.md (SPEC-016 v1.6.0) — el objeto embebido en las
// respuestas de lectura de Producto es el mismo `UnidadMedidaDTO` del catálogo (SPEC-021), no un
// DTO propio de Productos.
export type { UnidadMedidaDTO };

export interface TagDTO {
  id: string;
  nombre: string;
  slug: string;
  color: string;
}

export interface TagResumenDTO {
  slug: string;
  color: string;
}

export interface ProductoSelectorDTO {
  id: string;
  sku: string | null;
  nombreCorto: string;
  precioVenta: string;
}

export interface ProductoResumenDTO {
  id: string;
  sku: string | null;
  nombreCorto: string;
  tipo: TipoProductoDomain;
  estado: EstadoProductoDomain;
  unidadMedida: UnidadMedidaDTO | null;
  requiereBascula: boolean;
  costoEstimado: string;
  costoPromedio: string;
  margenDeseadoPorcentaje: string | null;
  precioVentaSugerido?: string;
  precioVenta: string;
  descuentoPorcentaje: string | null;
  tags: TagResumenDTO[];
}

export interface ProductoDTO {
  id: string;
  sku: string | null;
  codigoBarras: string | null;
  nombreCorto: string;
  nombreLargo: string;
  tipo: TipoProductoDomain;
  estado: EstadoProductoDomain;
  categoriaId: string | null;
  subcategoriaId: string | null;
  unidadMedida: UnidadMedidaDTO | null;
  requiereBascula: boolean;
  costoEstimado: string;
  costoPromedio: string;
  stockMinimo: number | null;
  margenDeseadoPorcentaje: string | null;
  precioVentaSugerido?: string;
  precioVenta: string;
  descuentoPorcentaje: string | null;
  createdAt: string;
  updatedAt: string;
  tags: TagDTO[];
}

export interface HistorialPrecioDTO {
  id: string;
  costoAnterior: string;
  costoNuevo: string;
  costoPromedioAnterior: string | null;
  costoPromedioNuevo: string | null;
  precioVentaAnterior: string;
  precioVentaNuevo: string;
  margenDeseadoAnterior: string | null;
  margenDeseadoNuevo: string | null;
  fuente: FuentePrecioDomain;
  referenciaId: string | null;
  creadoEn: string;
}

export interface MargenAlertaDTO {
  tipo: 'MARGEN_REDUCIDO';
  margenReal: string;
  margenDeseado: string;
}

export interface AdvertenciaDTO {
  tipo: 'CAMPO_IGNORADO_SERVICIO';
  campo: string;
  mensaje: string;
}

export interface ListarProductosParams {
  q?: string;
  estado?: EstadoProductoDomain;
  tipo?: TipoProductoDomain;
  categoriaId?: string;
  tag?: string;
  requiereBascula?: boolean;
  page: number;
  limit: number;
  incluirEliminados?: boolean;
}

export interface ListarProductosResult {
  productos: ProductoResumenDTO[];
  meta: { page: number; limit: number; total: number };
}
