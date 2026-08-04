import { useMutation, useQueryClient } from '@tanstack/react-query';
import { asignarTags, desasignarTag } from '../services/producto.service';
import { invalidateProductoQueries } from './invalidateProductoQueries';
import type { ApiError } from '../../../services/apiClient';
import type { ProductoDTO } from '../types/producto.types';

interface AsignarTagsVariables {
  id: string;
  tagIds: string[];
}

// SPEC-009 REQ-E7 — `PUT /:id/tags` reemplaza el array completo; usado solo para agregar (REQ-E7),
// nunca para quitar (ver useDesasignarTag/REQ-E8, endpoint dedicado por tag).
export function useAsignarTags() {
  const queryClient = useQueryClient();
  return useMutation<ProductoDTO, ApiError, AsignarTagsVariables>({
    mutationFn: ({ id, tagIds }) => asignarTags(id, tagIds),
    onSuccess: () => invalidateProductoQueries(queryClient),
  });
}

interface DesasignarTagVariables {
  id: string;
  tagId: string;
}

// SPEC-009 REQ-E8 — quitar un tag específico sin reenviar el array completo.
export function useDesasignarTag() {
  const queryClient = useQueryClient();
  return useMutation<ProductoDTO, ApiError, DesasignarTagVariables>({
    mutationFn: ({ id, tagId }) => desasignarTag(id, tagId),
    onSuccess: () => invalidateProductoQueries(queryClient),
  });
}
