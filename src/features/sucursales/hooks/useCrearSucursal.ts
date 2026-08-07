import { useMutation, useQueryClient } from '@tanstack/react-query';
import { crearSucursal } from '../services/sucursal.service';
import { invalidateSucursalQueries } from './invalidateSucursalQueries';
import type { ApiError } from '../../../services/apiClient';
import type { SucursalDTO } from '../types/sucursal.types';

export function useCrearSucursal() {
  const queryClient = useQueryClient();
  return useMutation<SucursalDTO, ApiError, object>({
    mutationFn: crearSucursal,
    onSuccess: () => invalidateSucursalQueries(queryClient),
  });
}
