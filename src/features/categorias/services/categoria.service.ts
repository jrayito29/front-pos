import { apiClient } from '../../../services/apiClient';
import type { CategoriaDTO, CategoriaSelectorDTO, SelectorCategoriasParams } from '../types/categoria.types';

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

interface CategoriaApiResponse {
  success: true;
  data: CategoriaDTO;
}

export async function crearCategoria(payload: object) {
  const { data } = await apiClient.post<CategoriaApiResponse>('/categorias', payload);
  return data.data;
}
