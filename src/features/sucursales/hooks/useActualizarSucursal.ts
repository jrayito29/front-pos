import { useMutation, useQueryClient } from '@tanstack/react-query';
import { actualizarSucursal } from '../services/sucursal.service';
import { invalidateSucursalQueries } from './invalidateSucursalQueries';
import type { ApiError } from '../../../services/apiClient';
import type { SucursalDTO } from '../types/sucursal.types';

interface ActualizarSucursalVariables {
  id: string;
  payload: object;
}

export function useActualizarSucursal() {
  const queryClient = useQueryClient();
  return useMutation<SucursalDTO, ApiError, ActualizarSucursalVariables>({
    mutationFn: ({ id, payload }) => actualizarSucursal(id, payload),
    onSuccess: () => invalidateSucursalQueries(queryClient),
  });
}
