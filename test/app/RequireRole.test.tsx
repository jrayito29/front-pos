import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { RequireRole } from '../../src/app/RequireRole';
import { useSessionStore } from '../../src/stores/session.store';
import { apiClient } from '../../src/services/apiClient';
import { ROUTES } from '../../src/constants/routes';
import type { PermisosEfectivosUsuario } from '../../src/features/auth/types/permisos.types';

function okResponse(data: unknown, config: InternalAxiosRequestConfig): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config };
}

function permisosFixture(role: string): PermisosEfectivosUsuario {
  return {
    userId: 'usuario-9',
    role,
    accesoTotal: role === 'superadmin',
    modulos: [],
  };
}

function renderGuard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ROUTES.DASHBOARD]}>
        <Routes>
          <Route path={ROUTES.NO_AUTORIZADO} element={<p>no autorizado</p>} />
          <Route element={<RequireRole role="superadmin" />}>
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

describe('RequireRole', () => {
  // spec:SPEC-011:REQ-U2
  it('muestra un skeleton mientras usePermisos() está cargando', () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = (() => new Promise(() => {})) as unknown as AxiosAdapter;

    renderGuard();

    expect(screen.getByRole('status', { name: 'Verificando permisos' })).toBeInTheDocument();
    expect(screen.queryByText('contenido protegido')).not.toBeInTheDocument();
  });

  // spec:SPEC-011:REQ-U2/U3
  it('renderiza el Outlet cuando data.role coincide con el rol exigido', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) =>
      okResponse({ success: true, data: permisosFixture('superadmin') }, config)) as AxiosAdapter;

    renderGuard();

    expect(await screen.findByText('contenido protegido')).toBeInTheDocument();
  });

  // spec:SPEC-011:REQ-X3
  it('redirige a /no-autorizado (no a /login) cuando el rol no coincide', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) =>
      okResponse({ success: true, data: permisosFixture('cajero') }, config)) as AxiosAdapter;

    renderGuard();

    expect(await screen.findByText('no autorizado')).toBeInTheDocument();
    expect(screen.queryByText('contenido protegido')).not.toBeInTheDocument();
  });

  // spec:SPEC-011:REQ-U2 (fail-closed)
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
});
