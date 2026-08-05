import { useQuery } from '@tanstack/react-query';
import { productosQueryKey } from '../../../constants/queryKeys';
import { listarProductos } from '../services/producto.service';
import type { ListarProductosParams } from '../types/producto.types';

// SPEC-009 REQ-U13 — listado paginado/filtrado, consumido por ProductosListPage.
// `enabled` (RESPUESTA-006) — permite a la página desactivar la petición cuando ya sabe, vía
// `puedeAccion(permisos, PRODUCTO_ACCION.VER)`, que el rol activo recibirá 403: evita disparar una
// petición condenada a fallar mientras `ProductosListPage` redirige a `/no-autorizado`.
export function useProductos(filtros: ListarProductosParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: productosQueryKey(filtros),
    queryFn: () => listarProductos(filtros),
    enabled: options.enabled ?? true,
  });
}
