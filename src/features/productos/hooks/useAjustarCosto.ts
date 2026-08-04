import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ajustarCosto } from '../services/producto.service';
import { invalidateProductoQueries } from './invalidateProductoQueries';
import type { AjustarCostoOutput } from '../schemas/ajustarCosto.schema';
import type { ApiError } from '../../../services/apiClient';
import type { ProductoDTO, MargenAlertaDTO } from '../types/producto.types';

interface AjustarCostoVariables {
  id: string;
  payload: AjustarCostoOutput;
}

interface AjustarCostoResult {
  producto: ProductoDTO;
  alerta?: MargenAlertaDTO;
}

// SPEC-009 REQ-U28/E6 — genera historial en el backend (SPEC-016 REQ-E4); la respuesta puede traer
// `alerta: MARGEN_REDUCIDO`, que el tab "Costos y precio" muestra inline (no toast, ver REQ-E6).
export function useAjustarCosto() {
  const queryClient = useQueryClient();
  return useMutation<AjustarCostoResult, ApiError, AjustarCostoVariables>({
    mutationFn: ({ id, payload }) => ajustarCosto(id, payload),
    onSuccess: () => invalidateProductoQueries(queryClient),
  });
}
