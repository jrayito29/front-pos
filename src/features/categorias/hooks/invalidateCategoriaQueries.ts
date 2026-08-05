import type { QueryClient } from '@tanstack/react-query';

// CLAUDE.md §6 — toda mutación que afecte categorías invalida explícitamente, nunca depende solo de
// `staleTime`. Predicate sobre el primer segmento del key cubre selector, listado y detalle
// (`['categorias', 'selector'|'listado'|'detalle', ...]`) con una sola invalidación.
export function invalidateCategoriaQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['categorias'] });
}
