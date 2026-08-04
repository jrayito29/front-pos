import { useMutation, useQueryClient } from '@tanstack/react-query';
import { crearCategoria } from '../services/categoria.service';
import type { ApiError } from '../../../services/apiClient';
import type { CategoriaDTO } from '../types/categoria.types';

// Al crear (raíz o subcategoría) se invalida todo `['categorias']` — cualquier select de
// Categoría/Subcategoría montado en ese momento (Crear o Ver/Editar) refleja la nueva opción sin
// que el consumidor tenga que reconstruir el query key manualmente (CLAUDE.md §6).
export function useCrearCategoria() {
  const queryClient = useQueryClient();
  return useMutation<CategoriaDTO, ApiError, object>({
    mutationFn: crearCategoria,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias'] }),
  });
}
