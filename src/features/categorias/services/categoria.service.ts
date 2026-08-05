import { apiClient } from '../../../services/apiClient';
import type {
  CategoriaDTO,
  CategoriaResumenDTO,
  CategoriaSelectorDTO,
  ListarCategoriasParams,
  SelectorCategoriasParams,
} from '../types/categoria.types';
import type { EstadoCategoriaDomain } from '../constants/categoria.constants';

// Mismo criterio que features/productos/services: el interceptor de apiClient.ts adjunta
// Authorization/x-usuario-id/x-empresa-id automáticamente. Rutas relativas a VITE_API_URL=/api/v1,
// reflejan api-pos/src/routes/v1/categorias.routes.ts (SPEC-020).

interface SelectorCategoriasApiResponse {
  success: true;
  data: CategoriaSelectorDTO[];
}

export async function selectorCategorias(params: SelectorCategoriasParams) {
  const { data } = await apiClient.get<SelectorCategoriasApiResponse>('/categorias/selector', { params });
  return data.data;
}

interface ListarCategoriasApiResponse {
  success: true;
  data: CategoriaResumenDTO[];
  meta: { page: number; limit: number; total: number };
}

export async function listarCategorias(params: ListarCategoriasParams) {
  const { data } = await apiClient.get<ListarCategoriasApiResponse>('/categorias', { params });
  return { categorias: data.data, meta: data.meta };
}

interface CategoriaApiResponse {
  success: true;
  data: CategoriaDTO;
}

export async function obtenerCategoria(id: string) {
  const { data } = await apiClient.get<CategoriaApiResponse>(`/categorias/${id}`);
  return data.data;
}

export async function crearCategoria(payload: object) {
  const { data } = await apiClient.post<CategoriaApiResponse>('/categorias', payload);
  return data.data;
}

export async function actualizarCategoria(id: string, payload: object) {
  const { data } = await apiClient.patch<CategoriaApiResponse>(`/categorias/${id}`, payload);
  return data.data;
}

export async function cambiarEstadoCategoria(id: string, estado: EstadoCategoriaDomain, confirmarCascada = false) {
  const { data } = await apiClient.patch<CategoriaApiResponse>(`/categorias/${id}/estado`, { estado, confirmarCascada });
  return data.data;
}

export async function eliminarCategoria(id: string) {
  await apiClient.delete(`/categorias/${id}`);
}
