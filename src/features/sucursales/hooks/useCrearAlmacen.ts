import { useMutation, useQueryClient } from '@tanstack/react-query';
import { crearAlmacen } from '../services/sucursal.service';
import { invalidateSucursalQueries } from './invalidateSucursalQueries';
import type { ApiError } from '../../../services/apiClient';
import type { AlmacenDTO } from '../types/sucursal.types';

interface CrearAlmacenVariables {
  sucursalId: string;
  payload: object;
}

// POST /sucursales/:sucursalId/almacenes — siempre crea con tipo PERSONALIZADO (REQ-E7); el tipo no
// viaja en `payload`, lo fija el backend.
export function useCrearAlmacen() {
  const queryClient = useQueryClient();
  return useMutation<AlmacenDTO, ApiError, CrearAlmacenVariables>({
    mutationFn: ({ sucursalId, payload }) => crearAlmacen(sucursalId, payload),
    onSuccess: () => invalidateSucursalQueries(queryClient),
  });
}
