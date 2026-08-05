import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { invalidateCategoriaQueries } from '../../../src/features/categorias/hooks/invalidateCategoriaQueries';

// spec:SPEC-010:REQ-E6 — toda mutación de escritura invalida `['categorias']` en bloque (selector,
// listado y detalle comparten ese prefijo, CLAUDE.md §6).
describe('invalidateCategoriaQueries', () => {
  it("invalida con predicate sobre el prefijo ['categorias']", () => {
    const queryClient = new QueryClient();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');

    invalidateCategoriaQueries(queryClient);

    expect(spy).toHaveBeenCalledWith({ queryKey: ['categorias'] });
  });

  it('marca como stale entradas de selector, listado y detalle con una sola llamada', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['categorias', 'selector', { soloRaiz: true }], []);
    queryClient.setQueryData(['categorias', 'listado', { page: 1, limit: 20 }], { categorias: [], meta: { page: 1, limit: 20, total: 0 } });
    queryClient.setQueryData(['categorias', 'detalle', 'cat-1'], null);

    await invalidateCategoriaQueries(queryClient);

    const queries = queryClient.getQueryCache().getAll();
    expect(queries).toHaveLength(3);
    queries.forEach((query) => expect(query.state.isInvalidated).toBe(true));
  });
});
