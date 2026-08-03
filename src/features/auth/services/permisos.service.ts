import { apiClient } from '../../../services/apiClient';
import type { PermisosEfectivosUsuario } from '../types/permisos.types';

interface PermisosApiResponse {
  success: true;
  data: PermisosEfectivosUsuario;
}

// SPEC-007 REQ-U1/U9 — el interceptor de request adjunta Authorization (accessToken) +
// x-usuario-id/x-empresa-id automáticamente (services/apiClient.ts), no se arman aquí.
export async function getMisPermisos(): Promise<PermisosEfectivosUsuario> {
  const { data } = await apiClient.get<PermisosApiResponse>('/auth/permisos');
  return data.data;
}
