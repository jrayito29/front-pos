import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eliminarCategoria } from '../services/categoria.service';
import { invalidateCategoriaQueries } from './invalidateCategoriaQueries';
import type { ApiError } from '../../../services/apiClient';

export function useEliminarCategoria() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id: string) => eliminarCategoria(id),
    onSuccess: () => invalidateCategoriaQueries(queryClient),
  });
}
