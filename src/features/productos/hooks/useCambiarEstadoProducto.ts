import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cambiarEstadoProducto } from '../services/producto.service';
import { invalidateProductoQueries } from './invalidateProductoQueries';
import type { EstadoProductoDomain } from '../constants/producto.constants';
import type { ApiError } from '../../../services/apiClient';
import type { ProductoDTO } from '../types/producto.types';

interface CambiarEstadoVariables {
  id: string;
  estado: EstadoProductoDomain;
}

// SPEC-009 REQ-E9/E10 — el control de Estado decide si pasa por el modal de confirmación
// (DISCONTINUADO) antes de llamar `mutate`; este hook no conoce esa distinción.
export function useCambiarEstadoProducto() {
  const queryClient = useQueryClient();
  return useMutation<ProductoDTO, ApiError, CambiarEstadoVariables>({
    mutationFn: ({ id, estado }) => cambiarEstadoProducto(id, estado),
    onSuccess: () => invalidateProductoQueries(queryClient),
  });
}
