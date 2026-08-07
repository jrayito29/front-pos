import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAlmacenesDeSucursal } from '../../../src/features/sucursales/hooks/useAlmacenesDeSucursal';
import { apiClient } from '../../../src/services/apiClient';
import type { AlmacenDTO } from '../../../src/features/sucursales/types/sucursal.types';

const almacenFixture: AlmacenDTO = {
  id: 'alm-1',
  nombre: 'Almacén de Ventas',
  tipo: 'VENTAS',
  codigoInterno: 'ALM-0001',
  codigoPersonalizable: null,
  permitirVenta: true,
  permitirTraspaso: true,
  esVirtual: false,
  activo: true,
  sucursalId: 'suc-1',
  empresaId: 'empresa-1',
  calle: 'Av. Juárez',
  numeroExterior: '123',
  numeroInterior: null,
  colonia: 'Centro',
  municipio: 'Monterrey',
  estado: 'Nuevo León',
  codigoPostal: '64000',
  direccionCompleta: 'Av. Juárez 123, Col. Centro, Monterrey, Nuevo León 64000',
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

// spec:SPEC-012:REQ-U7
describe('useAlmacenesDeSucursal', () => {
  it('consume GET /sucursales/:sucursalId/almacenes con los filtros de la tab y expone { almacenes, meta }', async () => {
    let capturedUrl: string | undefined;
    let capturedParams: unknown;
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      capturedUrl = config.url;
      capturedParams = config.params;
      return okResponse({ success: true, data: [almacenFixture], meta: { page: 1, limit: 20, total: 1 } }, config);
    }) as AxiosAdapter;

    const { result } = renderHook(() => useAlmacenesDeSucursal('suc-1', { q: 'ventas', page: 1, limit: 20 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toBe('/sucursales/suc-1/almacenes');
    expect(capturedParams).toEqual({ q: 'ventas', page: 1, limit: 20 });
    expect(result.current.data?.almacenes).toEqual([almacenFixture]);
  });

  it('no dispara la petición mientras `sucursalId` es undefined', async () => {
    const requestSpy = vi.fn(async (config: InternalAxiosRequestConfig) =>
      okResponse({ success: true, data: [], meta: { page: 1, limit: 20, total: 0 } }, config)
    );
    apiClient.defaults.adapter = requestSpy as unknown as AxiosAdapter;

    const { result } = renderHook(() => useAlmacenesDeSucursal(undefined, { page: 1, limit: 20 }), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.fetchStatus).toBe('idle');
    expect(requestSpy).not.toHaveBeenCalled();
  });

  // spec:SPEC-012:REQ-S5 — la tab "Almacenes" no dispara la petición si el rol no tiene `almacenes.ver`
  it('no dispara la petición cuando `enabled` es false, aunque haya `sucursalId`', async () => {
    const requestSpy = vi.fn(async (config: InternalAxiosRequestConfig) =>
      okResponse({ success: true, data: [], meta: { page: 1, limit: 20, total: 0 } }, config)
    );
    apiClient.defaults.adapter = requestSpy as unknown as AxiosAdapter;

    const { result } = renderHook(() => useAlmacenesDeSucursal('suc-1', { page: 1, limit: 20 }, { enabled: false }), {
      wrapper,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.fetchStatus).toBe('idle');
    expect(requestSpy).not.toHaveBeenCalled();
  });
});
