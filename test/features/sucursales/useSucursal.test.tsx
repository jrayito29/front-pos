import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useSucursal } from '../../../src/features/sucursales/hooks/useSucursal';
import { apiClient } from '../../../src/services/apiClient';
import type { SucursalConAlmacenesDTO } from '../../../src/features/sucursales/types/sucursal.types';

const sucursalFixture: SucursalConAlmacenesDTO = {
  id: 'suc-1',
  nombre: 'Sucursal Centro',
  codigoInterno: 'SUC-0001',
  codigoPersonalizable: 'SUC-CENTRO',
  telefono: '8112345678',
  email: 'centro@empresa.com',
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
  almacenes: [
    {
      id: 'alm-1',
      nombre: 'Almacén de Ventas',
      tipo: 'VENTAS',
      codigoInterno: 'ALM-0001',
      codigoPersonalizable: null,
      permitirVenta: true,
      permitirTraspaso: true,
      esVirtual: false,
      activo: true,
    },
  ],
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

// spec:SPEC-012:REQ-U6 — detalle consumido por SucursalDetallePage (Ver/Editar y badge de conteo de la tab Almacenes)
describe('useSucursal', () => {
  it('consume GET /sucursales/:id y expone el SucursalConAlmacenesDTO completo', async () => {
    let capturedUrl: string | undefined;
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      capturedUrl = config.url;
      return okResponse({ success: true, data: sucursalFixture }, config);
    }) as AxiosAdapter;

    const { result } = renderHook(() => useSucursal('suc-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toBe('/sucursales/suc-1');
    expect(result.current.data).toEqual(sucursalFixture);
  });

  it('no dispara la petición mientras `id` es undefined', async () => {
    const requestSpy = vi.fn(async (config: InternalAxiosRequestConfig) => okResponse({ success: true, data: sucursalFixture }, config));
    apiClient.defaults.adapter = requestSpy as unknown as AxiosAdapter;

    const { result } = renderHook(() => useSucursal(undefined), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.fetchStatus).toBe('idle');
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('no dispara la petición cuando `enabled` es false, aunque haya `id`', async () => {
    const requestSpy = vi.fn(async (config: InternalAxiosRequestConfig) => okResponse({ success: true, data: sucursalFixture }, config));
    apiClient.defaults.adapter = requestSpy as unknown as AxiosAdapter;

    const { result } = renderHook(() => useSucursal('suc-1', { enabled: false }), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.fetchStatus).toBe('idle');
    expect(requestSpy).not.toHaveBeenCalled();
  });

  // spec:SPEC-012:REQ-X8 — 404/sucursal de otra empresa: la página debe poder distinguir este caso vía isError
  it('expone isError cuando el backend responde 404 (sucursal no encontrada o de otra empresa)', async () => {
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      throw {
        message: 'La sucursal no existe.',
        isAxiosError: true,
        config,
        response: { status: 404, data: { success: false, error: { code: 'ERR_SUCURSAL_NOT_FOUND', message: 'La sucursal no existe.' } } },
      };
    }) as AxiosAdapter;

    const { result } = renderHook(() => useSucursal('suc-inexistente'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
