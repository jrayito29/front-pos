import { useMutation, useQueryClient } from '@tanstack/react-query';
import { desactivarUsuario } from '../services/usuario.service';
import { invalidateUsuarioQueries } from './invalidateUsuarioQueries';
import type { ApiError } from '../../../services/apiClient';

export function useDesactivarUsuario() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id: string) => desactivarUsuario(id),
    onSuccess: () => invalidateUsuarioQueries(queryClient),
  });
}
