import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cambiarEstadoCategoria } from '../services/categoria.service';
import { invalidateCategoriaQueries } from './invalidateCategoriaQueries';
import type { EstadoCategoriaDomain } from '../constants/categoria.constants';
import type { ApiError } from '../../../services/apiClient';
import type { CategoriaDTO } from '../types/categoria.types';

interface CambiarEstadoVariables {
  id: string;
  estado: EstadoCategoriaDomain;
  confirmarCascada?: boolean;
}

// CategoriaEstadoControl decide si hace falta `confirmarCascada` (a partir de
// `categoria.subcategorias` ya cargadas por GET /:id) antes de llamar `mutate`; este hook no conoce
// esa distinción.
export function useCambiarEstadoCategoria() {
  const queryClient = useQueryClient();
  return useMutation<CategoriaDTO, ApiError, CambiarEstadoVariables>({
    mutationFn: ({ id, estado, confirmarCascada }) => cambiarEstadoCategoria(id, estado, confirmarCascada),
    onSuccess: () => invalidateCategoriaQueries(queryClient),
  });
}
