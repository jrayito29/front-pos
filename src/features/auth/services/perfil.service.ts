import { apiClient } from '../../../services/apiClient';
import type { PerfilUsuarioResponse } from '../types/perfil.types';

interface PerfilApiResponse {
  success: true;
  data: PerfilUsuarioResponse;
}

// El interceptor de request adjunta Authorization/x-usuario-id/x-empresa-id automáticamente
// (services/apiClient.ts), no se arman aquí — mismo criterio que getMisPermisos.
export async function getPerfilUsuario(): Promise<PerfilUsuarioResponse> {
  const { data } = await apiClient.get<PerfilApiResponse>('/auth/perfil');
  return data.data;
}
