import { useMutation, useQueryClient } from '@tanstack/react-query';
import { actualizarProducto } from '../services/producto.service';
import { invalidateProductoQueries } from './invalidateProductoQueries';
import type { ApiError } from '../../../services/apiClient';
import type { ProductoDTO, AdvertenciaDTO } from '../types/producto.types';

interface ActualizarProductoVariables {
  id: string;
  payload: object;
}

interface ActualizarProductoResult {
  producto: ProductoDTO;
  advertencias?: AdvertenciaDTO[];
}

// SPEC-009 REQ-U27 — mutación propia del tab "Información general", independiente de las de
// costo/estado/tags (REQ-U27: cada tab guarda por separado, nunca un submit global).
export function useActualizarProducto() {
  const queryClient = useQueryClient();
  return useMutation<ActualizarProductoResult, ApiError, ActualizarProductoVariables>({
    mutationFn: ({ id, payload }) => actualizarProducto(id, payload),
    onSuccess: () => invalidateProductoQueries(queryClient),
  });
}
