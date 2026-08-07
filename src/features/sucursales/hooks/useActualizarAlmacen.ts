import { useMutation, useQueryClient } from '@tanstack/react-query';
import { actualizarAlmacen } from '../services/sucursal.service';
import { invalidateSucursalQueries } from './invalidateSucursalQueries';
import type { ApiError } from '../../../services/apiClient';
import type { AlmacenDTO } from '../types/sucursal.types';

interface ActualizarAlmacenVariables {
  id: string;
  payload: object;
}

export function useActualizarAlmacen() {
  const queryClient = useQueryClient();
  return useMutation<AlmacenDTO, ApiError, ActualizarAlmacenVariables>({
    mutationFn: ({ id, payload }) => actualizarAlmacen(id, payload),
    onSuccess: () => invalidateSucursalQueries(queryClient),
  });
}
