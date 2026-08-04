import { useMutation, useQueryClient } from '@tanstack/react-query';
import { crearProducto } from '../services/producto.service';
import { invalidateProductoQueries } from './invalidateProductoQueries';
import type { ApiError } from '../../../services/apiClient';
import type { ProductoDTO } from '../types/producto.types';

// SPEC-009 REQ-E4 — la navegación a /productos/:id y el toast de éxito son responsabilidad de
// ProductoCrearPage (pasados por `mutate(payload, { onSuccess })`), no de este hook. `ApiError` como
// TError explícito evita castear `error as ApiError` en cada `onError` consumidor.
export function useCrearProducto() {
  const queryClient = useQueryClient();
  return useMutation<ProductoDTO, ApiError, object>({
    mutationFn: crearProducto,
    onSuccess: () => invalidateProductoQueries(queryClient),
  });
}
