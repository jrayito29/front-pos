import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cambiarEstadoAlmacen } from '../services/sucursal.service';
import { invalidateSucursalQueries } from './invalidateSucursalQueries';
import type { ApiError } from '../../../services/apiClient';
import type { AlmacenDTO } from '../types/sucursal.types';

interface CambiarEstadoAlmacenVariables {
  id: string;
  activo: boolean;
}

// A diferencia de Sucursal, no hay confirmación previa: si el backend responde 409
// ERR_ALMACEN_CON_STOCK, AlmacenEstadoControl lo muestra vía toast (REQ-E8).
export function useCambiarEstadoAlmacen() {
  const queryClient = useQueryClient();
  return useMutation<AlmacenDTO, ApiError, CambiarEstadoAlmacenVariables>({
    mutationFn: ({ id, activo }) => cambiarEstadoAlmacen(id, activo),
    onSuccess: () => invalidateSucursalQueries(queryClient),
  });
}
