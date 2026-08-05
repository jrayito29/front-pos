import { useMutation, useQueryClient } from '@tanstack/react-query';
import { actualizarCategoria } from '../services/categoria.service';
import { invalidateCategoriaQueries } from './invalidateCategoriaQueries';
import type { ApiError } from '../../../services/apiClient';
import type { CategoriaDTO } from '../types/categoria.types';

interface ActualizarCategoriaVariables {
  id: string;
  payload: object;
}

export function useActualizarCategoria() {
  const queryClient = useQueryClient();
  return useMutation<CategoriaDTO, ApiError, ActualizarCategoriaVariables>({
    mutationFn: ({ id, payload }) => actualizarCategoria(id, payload),
    onSuccess: () => invalidateCategoriaQueries(queryClient),
  });
}
