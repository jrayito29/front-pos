import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eliminarProducto } from '../services/producto.service';
import { invalidateProductoQueries } from './invalidateProductoQueries';
import type { ApiError } from '../../../services/apiClient';

// SPEC-009 REQ-E11/E12 — el modal de confirmación (listado o detalle) llama a `mutate` solo tras
// confirmar; la navegación posterior difiere según el origen (permanece en /productos desde el
// listado, navega a /productos desde el detalle) y vive en el componente, no aquí.
export function useEliminarProducto() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id: string) => eliminarProducto(id),
    onSuccess: () => invalidateProductoQueries(queryClient),
  });
}
