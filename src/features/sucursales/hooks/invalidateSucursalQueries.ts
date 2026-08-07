import type { QueryClient } from '@tanstack/react-query';

// CLAUDE.md §6 — toda mutación que afecte sucursales o almacenes invalida explícitamente, nunca
// depende solo de `staleTime`. Predicate sobre el primer segmento del key cubre listado, detalle y
// la tabla de almacenes de cualquier sucursal (`['sucursales', 'listado'|'detalle'|'almacenes', ...]`)
// con una sola invalidación. Ref: SPEC-012 REQ-E9.
export function invalidateSucursalQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['sucursales'] });
}
