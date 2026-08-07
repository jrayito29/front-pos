import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cambiarEstadoSucursal } from '../services/sucursal.service';
import { invalidateSucursalQueries } from './invalidateSucursalQueries';
import type { ApiError } from '../../../services/apiClient';
import type { DesactivacionConWarningDTO, SucursalDTO } from '../types/sucursal.types';

interface CambiarEstadoSucursalVariables {
  id: string;
  activo: boolean;
  confirmarConStock?: boolean;
}

// SucursalEstadoControl decide, a partir de la respuesta, si debe abrir el modal de confirmación
// por stock (`requiereConfirmacion` presente) o dar el cambio por aplicado. Ref: SPEC-012 REQ-E4/E5.
export function useCambiarEstadoSucursal() {
  const queryClient = useQueryClient();
  return useMutation<SucursalDTO | DesactivacionConWarningDTO, ApiError, CambiarEstadoSucursalVariables>({
    mutationFn: ({ id, activo, confirmarConStock }) => cambiarEstadoSucursal(id, activo, confirmarConStock),
    onSuccess: () => invalidateSucursalQueries(queryClient),
  });
}
