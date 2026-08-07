import { apiClient } from '../../../services/apiClient';
import type {
  AlmacenDTO,
  DesactivacionConWarningDTO,
  ListarAlmacenesDeSucursalParams,
  ListarSucursalesParams,
  SucursalConAlmacenesDTO,
  SucursalDTO,
} from '../types/sucursal.types';

// Mismo criterio que features/categorias/services: el interceptor de apiClient.ts adjunta
// Authorization/x-usuario-id/x-empresa-id automáticamente. Rutas relativas a VITE_API_URL=/api/v1,
// reflejan api-pos/src/routes/v1/sucursales.routes.ts y almacenes.routes.ts (SPEC-014).

interface ListarSucursalesApiResponse {
  success: true;
  data: SucursalDTO[];
  meta: { page: number; limit: number; total: number };
}

export async function listarSucursales(params: ListarSucursalesParams) {
  const { data } = await apiClient.get<ListarSucursalesApiResponse>('/sucursales', { params });
  return { sucursales: data.data, meta: data.meta };
}

interface SucursalApiResponse {
  success: true;
  data: SucursalConAlmacenesDTO;
}

export async function obtenerSucursal(id: string) {
  const { data } = await apiClient.get<SucursalApiResponse>(`/sucursales/${id}`);
  return data.data;
}

interface CrearOActualizarSucursalApiResponse {
  success: true;
  data: SucursalDTO;
}

export async function crearSucursal(payload: object) {
  const { data } = await apiClient.post<CrearOActualizarSucursalApiResponse>('/sucursales', payload);
  return data.data;
}

export async function actualizarSucursal(id: string, payload: object) {
  const { data } = await apiClient.patch<CrearOActualizarSucursalApiResponse>(`/sucursales/${id}`, payload);
  return data.data;
}

// SPEC-014 §Flujo de Desactivación — la respuesta es `SucursalDTO` cuando el cambio se aplica de
// inmediato, o `DesactivacionConWarningDTO` (mismo `success: true`, 200) cuando hay almacenes con
// stock y se requiere reenviar con `confirmarConStock: true`. SucursalEstadoControl distingue ambas
// ramas por la presencia de `requiereConfirmacion`.
interface CambiarEstadoSucursalApiResponse {
  success: true;
  data: SucursalDTO | DesactivacionConWarningDTO;
}

export async function cambiarEstadoSucursal(id: string, activo: boolean, confirmarConStock = false) {
  const { data } = await apiClient.patch<CambiarEstadoSucursalApiResponse>(`/sucursales/${id}/estado`, {
    activo,
    confirmarConStock,
  });
  return data.data;
}

interface ListarAlmacenesApiResponse {
  success: true;
  data: AlmacenDTO[];
  meta: { page: number; limit: number; total: number };
}

export async function listarAlmacenesDeSucursal(sucursalId: string, params: ListarAlmacenesDeSucursalParams) {
  const { data } = await apiClient.get<ListarAlmacenesApiResponse>(`/sucursales/${sucursalId}/almacenes`, { params });
  return { almacenes: data.data, meta: data.meta };
}

interface AlmacenApiResponse {
  success: true;
  data: AlmacenDTO;
}

export async function crearAlmacen(sucursalId: string, payload: object) {
  const { data } = await apiClient.post<AlmacenApiResponse>(`/sucursales/${sucursalId}/almacenes`, payload);
  return data.data;
}

export async function actualizarAlmacen(id: string, payload: object) {
  const { data } = await apiClient.patch<AlmacenApiResponse>(`/almacenes/${id}`, payload);
  return data.data;
}

export async function cambiarEstadoAlmacen(id: string, activo: boolean) {
  const { data } = await apiClient.patch<AlmacenApiResponse>(`/almacenes/${id}/estado`, { activo });
  return data.data;
}
