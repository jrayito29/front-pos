import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { invalidateUsuarioQueries } from '../../../src/features/usuarios/hooks/invalidateUsuarioQueries';

// spec:SPEC-011:REQ-E5 — toda mutación de escritura invalida `['usuarios']` en bloque (listado y
// detalle comparten ese prefijo, CLAUDE.md §6).
describe('invalidateUsuarioQueries', () => {
  it("invalida con predicate sobre el prefijo ['usuarios']", () => {
    const queryClient = new QueryClient();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');

    invalidateUsuarioQueries(queryClient);

    expect(spy).toHaveBeenCalledWith({ queryKey: ['usuarios'] });
  });

  it('marca como stale entradas de listado y detalle con una sola llamada', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['usuarios', 'listado', { page: 1, limit: 20 }], { usuarios: [], meta: { page: 1, limit: 20, total: 0 } });
    queryClient.setQueryData(['usuarios', 'detalle', 'usuario-1'], null);

    await invalidateUsuarioQueries(queryClient);

    const queries = queryClient.getQueryCache().getAll();
    expect(queries).toHaveLength(2);
    queries.forEach((query) => expect(query.state.isInvalidated).toBe(true));
  });
});
