import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useCategoria } from '../../../src/features/categorias/hooks/useCategoria';
import { apiClient } from '../../../src/services/apiClient';
import type { CategoriaDTO } from '../../../src/features/categorias/types/categoria.types';

const categoriaFixture: CategoriaDTO = {
  id: 'cat-1',
  nombre: 'Ropa Dama',
  padreId: null,
  estado: 'ACTIVO',
  descripcion: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  subcategorias: [{ id: 'sub-1', nombre: 'Blusas', estado: 'ACTIVO' }],
};

function okResponse(data: unknown, config: InternalAxiosRequestConfig): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config };
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

// spec:SPEC-010:REQ-E1
describe('useCategoria', () => {
  it('consume GET /categorias/:id y expone el CategoriaDTO completo (incluye subcategorias)', async () => {
    let capturedUrl: string | undefined;
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      capturedUrl = config.url;
      return okResponse({ success: true, data: categoriaFixture }, config);
    }) as AxiosAdapter;

    const { result } = renderHook(() => useCategoria('cat-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toBe('/categorias/cat-1');
    expect(result.current.data).toEqual(categoriaFixture);
  });

  it('no dispara la petición mientras `id` es undefined', async () => {
    const requestSpy = vi.fn(async (config: InternalAxiosRequestConfig) => okResponse({ success: true, data: categoriaFixture }, config));
    apiClient.defaults.adapter = requestSpy as unknown as AxiosAdapter;

    const { result } = renderHook(() => useCategoria(undefined), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.fetchStatus).toBe('idle');
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('no dispara la petición cuando `enabled` es false, aunque haya `id`', async () => {
    const requestSpy = vi.fn(async (config: InternalAxiosRequestConfig) => okResponse({ success: true, data: categoriaFixture }, config));
    apiClient.defaults.adapter = requestSpy as unknown as AxiosAdapter;

    const { result } = renderHook(() => useCategoria('cat-1', { enabled: false }), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.fetchStatus).toBe('idle');
    expect(requestSpy).not.toHaveBeenCalled();
  });
});
