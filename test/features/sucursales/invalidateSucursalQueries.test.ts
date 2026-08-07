import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { invalidateSucursalQueries } from '../../../src/features/sucursales/hooks/invalidateSucursalQueries';

// spec:SPEC-012:REQ-E9 — toda mutación de escritura invalida `['sucursales']` en bloque (listado,
// detalle y tabla de almacenes comparten ese prefijo, CLAUDE.md §6).
describe('invalidateSucursalQueries', () => {
  it("invalida con predicate sobre el prefijo ['sucursales']", () => {
    const queryClient = new QueryClient();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');

    invalidateSucursalQueries(queryClient);

    expect(spy).toHaveBeenCalledWith({ queryKey: ['sucursales'] });
  });

  it('marca como stale entradas de listado, detalle y tabla de almacenes con una sola llamada', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['sucursales', 'listado', { page: 1, limit: 20 }], {
      sucursales: [],
      meta: { page: 1, limit: 20, total: 0 },
    });
    queryClient.setQueryData(['sucursales', 'detalle', 'suc-1'], null);
    queryClient.setQueryData(['sucursales', 'almacenes', 'suc-1', { page: 1, limit: 20 }], {
      almacenes: [],
      meta: { page: 1, limit: 20, total: 0 },
    });

    await invalidateSucursalQueries(queryClient);

    const queries = queryClient.getQueryCache().getAll();
    expect(queries).toHaveLength(3);
    queries.forEach((query) => expect(query.state.isInvalidated).toBe(true));
  });
});
