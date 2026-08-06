import { useMutation, useQueryClient } from '@tanstack/react-query';
import { crearUsuario } from '../services/usuario.service';
import { invalidateUsuarioQueries } from './invalidateUsuarioQueries';
import type { ApiError } from '../../../services/apiClient';
import type { UsuarioCreadoDTO } from '../types/usuario.types';

export function useCrearUsuario() {
  const queryClient = useQueryClient();
  return useMutation<UsuarioCreadoDTO, ApiError, object>({
    mutationFn: crearUsuario,
    onSuccess: () => invalidateUsuarioQueries(queryClient),
  });
}
