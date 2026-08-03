import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { RequirePermission } from '../../src/app/RequirePermission';
import { useSessionStore } from '../../src/stores/session.store';
import { apiClient } from '../../src/services/apiClient';
import { ROUTES } from '../../src/constants/routes';
import type { PermisosEfectivosUsuario } from '../../src/features/auth/types/permisos.types';

function okResponse(data: unknown, config: InternalAxiosRequestConfig): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config };
}

function permisosFixture(activo: boolean, accesoTotal = false): PermisosEfectivosUsuario {
  return {
    userId: 'usuario-9',
    role: accesoTotal ? 'superadmin' : 'cajero',
    accesoTotal,
    // RESPUESTA-003 — cuando accesoTotal es true, el backend siempre responde `modulos: []`.
    modulos: accesoTotal
      ? []
      : [
          {
            modulo: 'modulo.ventas',
            activo,
            soloAdmin: false,
            fuenteModulo: 'plan',
            esOverrideModulo: false,
            acciones: [],
          },
        ],
  };
}

function renderGuard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ROUTES.DASHBOARD]}>
        <Routes>
          <Route path={ROUTES.NO_AUTORIZADO} element={<p>no autorizado</p>} />
          <Route element={<RequirePermission modulo="modulo.ventas" />}>
            <Route path={ROUTES.DASHBOARD} element={<p>contenido protegido</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => {
  useSessionStore.getState().clearSession();
});

describe('RequirePermission', () => {
  // spec:SPEC-007:REQ-S1
  it('muestra un skeleton mientras usePermisos() está cargando', () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = (() => new Promise(() => {})) as unknown as AxiosAdapter;

    renderGuard();

    expect(screen.getByRole('status', { name: 'Verificando permisos' })).toBeInTheDocument();
    expect(screen.queryByText('contenido protegido')).not.toBeInTheDocument();
  });

  // spec:SPEC-007:REQ-U4
  it('renderiza el Outlet cuando el módulo está activo para el usuario', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) =>
      okResponse({ success: true, data: permisosFixture(true) }, config)) as AxiosAdapter;

    renderGuard();

    expect(await screen.findByText('contenido protegido')).toBeInTheDocument();
  });

  // spec:SPEC-007:REQ-E2
  it('redirige a /no-autorizado (no a /login) cuando el módulo no está activo', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) =>
      okResponse({ success: true, data: permisosFixture(false) }, config)) as AxiosAdapter;

    renderGuard();

    expect(await screen.findByText('no autorizado')).toBeInTheDocument();
  });

  // spec:SPEC-007:REQ-X1
  it('fail-closed: ante un error inesperado del endpoint, redirige a /no-autorizado', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      throw { message: 'boom', isAxiosError: true, config };
    }) as AxiosAdapter;

    renderGuard();

    expect(await screen.findByText('no autorizado')).toBeInTheDocument();
  });

  // RESPUESTA-003-datos-usuario-y-logo-empresa.md — bug de accesoTotal: sin este bypass, un
  // superadmin (accesoTotal: true, modulos: []) sería rechazado por tieneModuloActivo sobre un
  // arreglo vacío, pese a tener acceso total.
  it('con accesoTotal: true, renderiza el Outlet aunque el módulo no esté en `modulos` (vacío)', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) =>
      okResponse({ success: true, data: permisosFixture(false, true) }, config)) as AxiosAdapter;

    renderGuard();

    expect(await screen.findByText('contenido protegido')).toBeInTheDocument();
  });
});
