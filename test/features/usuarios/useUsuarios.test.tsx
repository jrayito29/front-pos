import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useUsuarios } from '../../../src/features/usuarios/hooks/useUsuarios';
import { apiClient } from '../../../src/services/apiClient';

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

// spec:SPEC-011:REQ-U1
describe('useUsuarios', () => {
  it('consume GET /usuarios con los filtros de la vista y expone { usuarios, meta }', async () => {
    let capturedParams: unknown;
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      capturedParams = config.params;
      return okResponse(
        {
          success: true,
          data: [
            {
              usuarioId: 'usuario-1',
              email: 'juan@empresa.com',
              role: 'cajero',
              nombre: 'Juan',
              apellidoPaterno: 'García',
              apellidoMaterno: null,
              createdAt: '2026-05-21T10:00:00.000Z',
            },
          ],
          meta: { page: 1, limit: 20, total: 1 },
        },
        config
      );
    }) as AxiosAdapter;

    const { result } = renderHook(() => useUsuarios({ search: 'juan', role: 'cajero', page: 1, limit: 20 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.usuarios).toHaveLength(1);
    expect(result.current.data?.meta).toEqual({ page: 1, limit: 20, total: 1 });
    expect(capturedParams).toEqual({ search: 'juan', role: 'cajero', page: 1, limit: 20 });
  });

  // spec:SPEC-011:REQ-X3 — la vista desactiva la query cuando el rol activo no es superadmin
  it('no dispara la petición cuando `enabled` es false', async () => {
    const requestSpy = vi.fn(async (config: InternalAxiosRequestConfig) =>
      okResponse({ success: true, data: [], meta: { page: 1, limit: 20, total: 0 } }, config)
    );
    apiClient.defaults.adapter = requestSpy as unknown as AxiosAdapter;

    const { result } = renderHook(() => useUsuarios({ page: 1, limit: 20 }, { enabled: false }), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.fetchStatus).toBe('idle');
    expect(requestSpy).not.toHaveBeenCalled();
  });

  // spec:SPEC-011:REQ-X1
  it('expone isError cuando la petición falla (red/servidor)', async () => {
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      throw { message: 'boom', isAxiosError: true, config };
    }) as AxiosAdapter;

    const { result } = renderHook(() => useUsuarios({ page: 1, limit: 20 }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
