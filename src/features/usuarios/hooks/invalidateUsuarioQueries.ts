import type { QueryClient } from '@tanstack/react-query';

// CLAUDE.md §6 — toda mutación que afecte usuarios invalida explícitamente, nunca depende solo de
// `staleTime`. Predicate sobre el primer segmento del key cubre listado y detalle
// (['usuarios', 'listado'|'detalle', ...]) con una sola invalidación.
export function invalidateUsuarioQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['usuarios'] });
}
