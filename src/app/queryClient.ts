import { QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiError } from '../services/apiClient';

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

// SPEC-007 REQ-X2 / CLAUDE.md §8 — errores de red/servidor de cualquier query se comunican vía
// toast global. Se excluyen códigos de negocio (401/403) que ya tienen su propio flujo de UI: los de
// refresh de token los gestiona el interceptor de respuesta de apiClient.ts (toast + redirect
// propios), y ERR_PERMISSION_DENIED dispara la invalidación de REQ-E1 en vez de un toast — mostrar
// "sin permisos" no es un error de red/servidor, es el resultado correcto de la query.
const SILENCED_ERROR_CODES = new Set(['ERR_TOKEN_EXPIRED', 'ERR_TOKEN_INVALID', 'ERR_PERMISSION_DENIED']);

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (isApiError(error) && !SILENCED_ERROR_CODES.has(error.code)) {
        toast.error(error.message || 'No se pudo cargar la información. Intenta de nuevo.');
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});
