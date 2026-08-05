import { useQuery } from '@tanstack/react-query';
import { categoriaQueryKey } from '../../../constants/queryKeys';
import { obtenerCategoria } from '../services/categoria.service';

// GET /api/v1/categorias/:id — consumido por CategoriaDetalleModal (ver/editar/estado/subcategorías).
export function useCategoria(id: string | undefined, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: categoriaQueryKey(id),
    queryFn: () => obtenerCategoria(id as string),
    enabled: Boolean(id) && (options.enabled ?? true),
  });
}
