import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AppLayout } from '../../../src/layouts/AppLayout/AppLayout';
import { apiClient } from '../../../src/services/apiClient';
import { useSessionStore } from '../../../src/stores/session.store';
import { ROUTES } from '../../../src/constants/routes';

function renderAppLayout(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<p>panel tenant</p>} />
            <Route path={ROUTES.SYSADMIN} element={<p>panel sysadmin</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => {
  useSessionStore.getState().clearSession();
});

describe('AppLayout — SPEC-008 REQ-U1', () => {
  // spec:SPEC-008:REQ-U1
  it('con empresaId en sesión (rama tenant), renderiza el menú tenant', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    // TenantChrome dispara tanto GET /auth/permisos (usePermisos) como GET /auth/perfil (usePerfil)
    // al montar — se enruta por URL para que ninguno de los dos quede con una forma inesperada.
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      if (config.url === '/auth/perfil') {
        return {
          data: { success: true, data: { nombre: 'Ana García', empresa: { nombre: 'Distribuidora del Norte', logoUrl: null } } },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }
      return {
        data: { success: true, data: { userId: 'usuario-9', role: 'cajero', accesoTotal: false, modulos: [] } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }) as AxiosAdapter;

    renderAppLayout(ROUTES.DASHBOARD);

    expect(await screen.findByRole('link', { name: 'Panel' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Empresas' })).not.toBeInTheDocument();
  });

  // spec:SPEC-008:REQ-U1 / spec:SPEC-008:REQ-X4
  it('sin empresaId en sesión (rama sysadmin), renderiza el menú de plataforma', () => {
    useSessionStore.getState().setSysAdminSession({ accessToken: 'access-1', refreshToken: 'refresh-1' });

    renderAppLayout(ROUTES.SYSADMIN);

    expect(screen.getByRole('link', { name: 'Empresas' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ventas' })).not.toBeInTheDocument();
  });
});
