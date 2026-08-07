import { useQuery } from '@tanstack/react-query';
import { almacenesDeSucursalQueryKey } from '../../../constants/queryKeys';
import { listarAlmacenesDeSucursal } from '../services/sucursal.service';
import type { ListarAlmacenesDeSucursalParams } from '../types/sucursal.types';

// GET /api/v1/sucursales/:sucursalId/almacenes — consumido por SucursalAlmacenesTab. Independiente
// del arreglo `almacenes` embebido en SucursalConAlmacenesDTO (solo trae activos y no pagina). Ref:
// SPEC-012 REQ-U7, REQ-S5.
export function useAlmacenesDeSucursal(
  sucursalId: string | undefined,
  filtros: ListarAlmacenesDeSucursalParams,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: almacenesDeSucursalQueryKey(sucursalId, filtros),
    queryFn: () => listarAlmacenesDeSucursal(sucursalId as string, filtros),
    enabled: Boolean(sucursalId) && (options.enabled ?? true),
  });
}
