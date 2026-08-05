import { useQuery } from '@tanstack/react-query';
import { categoriasQueryKey } from '../../../constants/queryKeys';
import { listarCategorias } from '../services/categoria.service';
import type { ListarCategoriasParams } from '../types/categoria.types';

// Listado paginado/filtrado, consumido por CategoriasListPage. `enabled` permite desactivar la
// petición cuando la página ya sabe (vía `puedeAccion(permisos, CATEGORIA_ACCION.VER)`) que el rol
// activo recibirá 403 — mismo criterio que useProductos.
export function useCategorias(filtros: ListarCategoriasParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: categoriasQueryKey(filtros),
    queryFn: () => listarCategorias(filtros),
    enabled: options.enabled ?? true,
  });
}
