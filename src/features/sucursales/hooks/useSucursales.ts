import { useQuery } from '@tanstack/react-query';
import { sucursalesQueryKey } from '../../../constants/queryKeys';
import { listarSucursales } from '../services/sucursal.service';
import type { ListarSucursalesParams } from '../types/sucursal.types';

// Listado paginado/filtrado, consumido por SucursalesListPage. `enabled` permite desactivar la
// petición cuando la página ya sabe (vía `puedeAccion(permisos, SUCURSAL_ACCION.VER)`) que el rol
// activo recibirá 403 — mismo criterio que useCategorias/useProductos. Ref: SPEC-012 REQ-U1, REQ-X3.
export function useSucursales(filtros: ListarSucursalesParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: sucursalesQueryKey(filtros),
    queryFn: () => listarSucursales(filtros),
    enabled: options.enabled ?? true,
  });
}
