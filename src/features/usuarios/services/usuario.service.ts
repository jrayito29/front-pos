import { apiClient } from '../../../services/apiClient';
import type {
  ListarUsuariosParams,
  RolActualizadoDTO,
  UsuarioCreadoDTO,
  UsuarioDetalleDTO,
  UsuarioListItemDTO,
} from '../types/usuario.types';
import type { RolAsignable } from '../constants/usuario.constants';

// Mismo criterio que features/categorias/services: el interceptor de apiClient.ts adjunta
// Authorization/x-usuario-id/x-empresa-id automáticamente. Rutas relativas a VITE_API_URL=/api/v1,
// reflejan api-pos/src/routes/v1/usuarios.routes.ts (SPEC-013).

interface ListarUsuariosApiResponse {
  success: true;
  data: UsuarioListItemDTO[];
  meta: { page: number; limit: number; total: number };
}

export async function listarUsuarios(params: ListarUsuariosParams) {
  const { data } = await apiClient.get<ListarUsuariosApiResponse>('/usuarios', { params });
  return { usuarios: data.data, meta: data.meta };
}

interface UsuarioDetalleApiResponse {
  success: true;
  data: UsuarioDetalleDTO;
}

export async function obtenerUsuario(id: string) {
  const { data } = await apiClient.get<UsuarioDetalleApiResponse>(`/usuarios/${id}`);
  return data.data;
}

interface UsuarioCreadoApiResponse {
  success: true;
  data: UsuarioCreadoDTO;
}

export async function crearUsuario(payload: object) {
  const { data } = await apiClient.post<UsuarioCreadoApiResponse>('/usuarios', payload);
  return data.data;
}

interface RolActualizadoApiResponse {
  success: true;
  data: RolActualizadoDTO;
}

export async function cambiarRolUsuario(id: string, role: RolAsignable) {
  const { data } = await apiClient.patch<RolActualizadoApiResponse>(`/usuarios/${id}/rol`, { role });
  return data.data;
}

export async function desactivarUsuario(id: string) {
  await apiClient.delete(`/usuarios/${id}`);
}
