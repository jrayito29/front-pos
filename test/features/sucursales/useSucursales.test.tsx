import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useSucursales } from '../../../src/features/sucursales/hooks/useSucursales';
import { apiClient } from '../../../src/services/apiClient';
import type { SucursalDTO } from '../../../src/features/sucursales/types/sucursal.types';

const sucursalFixture: SucursalDTO = {
  id: 'suc-1',
  nombre: 'Sucursal Centro',
  codigoInterno: 'SUC-0001',
  codigoPersonalizable: null,
  telefono: null,
  email: null,
  calle: 'Av. Juárez',
  numeroExterior: '123',
  numeroInterior: null,
  colonia: 'Centro',
  municipio: 'Monterrey',
  estado: 'Nuevo León',
  codigoPostal: '64000',
  direccionCompleta: 'Av. Juárez 123, Col. Centro, Monterrey, Nuevo León 64000',
  activo: true,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
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

// spec:SPEC-012:REQ-U1
describe('useSucursales', () => {
  it('consume GET /sucursales con los filtros de la vista y expone { sucursales, meta }', async () => {
    let capturedUrl: string | undefined;
    let capturedParams: unknown;
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      capturedUrl = config.url;
      capturedParams = config.params;
      return okResponse({ success: true, data: [sucursalFixture], meta: { page: 1, limit: 20, total: 1 } }, config);
    }) as AxiosAdapter;

    const { result } = renderHook(() => useSucursales({ q: 'centro', activo: true, page: 1, limit: 20 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toBe('/sucursales');
    expect(capturedParams).toEqual({ q: 'centro', activo: true, page: 1, limit: 20 });
    expect(result.current.data?.sucursales).toEqual([sucursalFixture]);
    expect(result.current.data?.meta).toEqual({ page: 1, limit: 20, total: 1 });
  });

  // spec:SPEC-012:REQ-X3 — la vista desactiva la query cuando ya sabe que el rol no tiene `sucursales.ver`
  it('no dispara la petición cuando `enabled` es false', async () => {
    const requestSpy = vi.fn(async (config: InternalAxiosRequestConfig) =>
      okResponse({ success: true, data: [], meta: { page: 1, limit: 20, total: 0 } }, config)
    );
    apiClient.defaults.adapter = requestSpy as unknown as AxiosAdapter;

    const { result } = renderHook(() => useSucursales({ page: 1, limit: 20 }, { enabled: false }), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.fetchStatus).toBe('idle');
    expect(requestSpy).not.toHaveBeenCalled();
  });

  // spec:SPEC-012:REQ-X1
  it('expone isError cuando la petición falla (red/servidor)', async () => {
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      throw { message: 'boom', isAxiosError: true, config };
    }) as AxiosAdapter;

    const { result } = renderHook(() => useSucursales({ page: 1, limit: 20 }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
