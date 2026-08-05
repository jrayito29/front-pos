import { apiClient } from '../../../services/apiClient';
import type { UnidadMedidaDTO, ListarUnidadesMedidaParams } from '../types/unidadMedida.types';

// Mismo criterio que features/categorias/services: el interceptor de apiClient.ts adjunta
// Authorization/x-usuario-id/x-empresa-id automáticamente. Ruta relativa a VITE_API_URL=/api/v1,
// refleja api-pos/src/routes/v1/unidad-medida.routes.ts (SPEC-021). Catálogo global de solo lectura
// — sin endpoints de escritura (SPEC-021 §DESIGN).

interface ListarUnidadesMedidaApiResponse {
  success: true;
  data: UnidadMedidaDTO[];
}

export async function listarUnidadesMedida(params: ListarUnidadesMedidaParams) {
  const { data } = await apiClient.get<ListarUnidadesMedidaApiResponse>('/unidades-medida', { params });
  return data.data;
}
