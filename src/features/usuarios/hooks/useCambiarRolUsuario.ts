import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cambiarRolUsuario } from '../services/usuario.service';
import { invalidateUsuarioQueries } from './invalidateUsuarioQueries';
import type { RolAsignable } from '../constants/usuario.constants';
import type { ApiError } from '../../../services/apiClient';
import type { RolActualizadoDTO } from '../types/usuario.types';

interface CambiarRolVariables {
  id: string;
  role: RolAsignable;
}

export function useCambiarRolUsuario() {
  const queryClient = useQueryClient();
  return useMutation<RolActualizadoDTO, ApiError, CambiarRolVariables>({
    mutationFn: ({ id, role }) => cambiarRolUsuario(id, role),
    onSuccess: () => invalidateUsuarioQueries(queryClient),
  });
}
