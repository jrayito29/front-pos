import type { QueryClient } from '@tanstack/react-query';

// SPEC-009 REQ-E13 — CLAUDE.md §6: toda mutación que afecte productos invalida explícitamente, nunca
// depende solo de `staleTime`. `predicate` sobre el primer segmento del key cubre tanto el listado
// (`['productos', filtros]`) como el detalle/historial (`['productos', 'detalle'|'historial-precios', id, ...]`)
// con una sola invalidación, sin tener que reconstruir cada key exacto.
export function invalidateProductoQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['productos'] });
}
