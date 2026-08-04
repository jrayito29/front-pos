import { apiClient } from '../../../services/apiClient';
import type {
  ProductoDTO,
  ProductoResumenDTO,
  ProductoSelectorDTO,
  HistorialPrecioDTO,
  MargenAlertaDTO,
  AdvertenciaDTO,
  ListarProductosParams,
} from '../types/producto.types';
import type { EstadoProductoDomain } from '../constants/producto.constants';

// SPEC-009 — mismo criterio que features/auth/services: el interceptor de apiClient.ts adjunta
// Authorization/x-usuario-id/x-empresa-id automáticamente, no se arman aquí. Rutas relativas a
// VITE_API_URL=/api/v1 (ver .env), reflejan api-pos/src/routes/v1/producto.routes.ts (SPEC-016).

interface ListarProductosApiResponse {
  success: true;
  data: ProductoResumenDTO[];
  meta: { page: number; limit: number; total: number };
}

export async function listarProductos(params: ListarProductosParams) {
  const { data } = await apiClient.get<ListarProductosApiResponse>('/productos', { params });
  return { productos: data.data, meta: data.meta };
}

interface SelectorProductosApiResponse {
  success: true;
  data: ProductoSelectorDTO[];
}

export async function selectorProductos(q: string, limit = 10) {
  const { data } = await apiClient.get<SelectorProductosApiResponse>('/productos/selector', { params: { q, limit } });
  return data.data;
}

interface ProductoApiResponse {
  success: true;
  data: ProductoDTO;
}

export async function obtenerProducto(id: string) {
  const { data } = await apiClient.get<ProductoApiResponse>(`/productos/${id}`);
  return data.data;
}

export async function crearProducto(payload: object) {
  const { data } = await apiClient.post<ProductoApiResponse>('/productos', payload);
  return data.data;
}

interface ActualizarProductoApiResponse {
  success: true;
  data: ProductoDTO;
  advertencias?: AdvertenciaDTO[];
}

export async function actualizarProducto(id: string, payload: object) {
  const { data } = await apiClient.patch<ActualizarProductoApiResponse>(`/productos/${id}`, payload);
  return { producto: data.data, advertencias: data.advertencias };
}

export async function cambiarEstadoProducto(id: string, estado: EstadoProductoDomain) {
  const { data } = await apiClient.patch<ProductoApiResponse>(`/productos/${id}/estado`, { estado });
  return data.data;
}

interface AjustarCostoPayload {
  costoEstimado: string;
  costoPromedio?: string;
  precioVenta: string;
  margenDeseadoPorcentaje?: string;
}

interface AjustarCostoApiResponse {
  success: true;
  data: ProductoDTO;
  alerta?: MargenAlertaDTO;
}

export async function ajustarCosto(id: string, payload: AjustarCostoPayload) {
  const { data } = await apiClient.patch<AjustarCostoApiResponse>(`/productos/${id}/costo`, payload);
  return { producto: data.data, alerta: data.alerta };
}

export async function eliminarProducto(id: string) {
  await apiClient.delete(`/productos/${id}`);
}

export async function asignarTags(id: string, tagIds: string[]) {
  const { data } = await apiClient.put<ProductoApiResponse>(`/productos/${id}/tags`, { tagIds });
  return data.data;
}

export async function desasignarTag(id: string, tagId: string) {
  const { data } = await apiClient.delete<ProductoApiResponse>(`/productos/${id}/tags/${tagId}`);
  return data.data;
}

interface HistorialPreciosApiResponse {
  success: true;
  data: HistorialPrecioDTO[];
}

export async function obtenerHistorialPrecios(id: string, periodo: string) {
  const { data } = await apiClient.get<HistorialPreciosApiResponse>(`/productos/${id}/historial-precios`, {
    params: { periodo },
  });
  return data.data;
}
