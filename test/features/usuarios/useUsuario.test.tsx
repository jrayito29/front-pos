import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useUsuario } from '../../../src/features/usuarios/hooks/useUsuario';
import { apiClient } from '../../../src/services/apiClient';
import type { UsuarioDetalleDTO } from '../../../src/features/usuarios/types/usuario.types';

const usuarioFixture: UsuarioDetalleDTO = {
  usuarioId: 'usuario-1',
  email: 'juan@empresa.com',
  role: 'cajero',
  perfil: { nombre: 'Juan', apellidoPaterno: 'García', apellidoMaterno: null, telefono: '55-1234-5678' },
  createdAt: '2026-05-21T10:00:00.000Z',
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

// spec:SPEC-011:REQ-E1
describe('useUsuario', () => {
  it('consume GET /usuarios/:id y expone el UsuarioDetalleDTO completo (incluye perfil.telefono)', async () => {
    let capturedUrl: string | undefined;
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      capturedUrl = config.url;
      return okResponse({ success: true, data: usuarioFixture }, config);
    }) as AxiosAdapter;

    const { result } = renderHook(() => useUsuario('usuario-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toBe('/usuarios/usuario-1');
    expect(result.current.data).toEqual(usuarioFixture);
  });

  it('no dispara la petición mientras `id` es undefined', async () => {
    const requestSpy = vi.fn(async (config: InternalAxiosRequestConfig) => okResponse({ success: true, data: usuarioFixture }, config));
    apiClient.defaults.adapter = requestSpy as unknown as AxiosAdapter;

    const { result } = renderHook(() => useUsuario(undefined), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.fetchStatus).toBe('idle');
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('no dispara la petición cuando `enabled` es false, aunque haya `id`', async () => {
    const requestSpy = vi.fn(async (config: InternalAxiosRequestConfig) => okResponse({ success: true, data: usuarioFixture }, config));
    apiClient.defaults.adapter = requestSpy as unknown as AxiosAdapter;

    const { result } = renderHook(() => useUsuario('usuario-1', { enabled: false }), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.fetchStatus).toBe('idle');
    expect(requestSpy).not.toHaveBeenCalled();
  });
});
