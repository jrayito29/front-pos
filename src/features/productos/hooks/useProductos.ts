import { useQuery } from '@tanstack/react-query';
import { productosQueryKey } from '../../../constants/queryKeys';
import { listarProductos } from '../services/producto.service';
import type { ListarProductosParams } from '../types/producto.types';

// SPEC-009 REQ-U13 — listado paginado/filtrado, consumido por ProductosListPage.
export function useProductos(filtros: ListarProductosParams) {
  return useQuery({
    queryKey: productosQueryKey(filtros),
    queryFn: () => listarProductos(filtros),
  });
}
