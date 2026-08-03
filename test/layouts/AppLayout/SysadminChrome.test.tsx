import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { SysadminChrome } from '../../../src/layouts/AppLayout/SysadminChrome';
import { apiClient } from '../../../src/services/apiClient';
import { useSessionStore } from '../../../src/stores/session.store';
import { ROUTES } from '../../../src/constants/routes';

function renderSysadminChrome() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ROUTES.SYSADMIN]}>
        <Routes>
          <Route element={<SysadminChrome />}>
            <Route path={ROUTES.SYSADMIN} element={<p>contenido panel sysadmin</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => {
  useSessionStore.getState().clearSession();
});

describe('SysadminChrome', () => {
  // spec:SPEC-008:REQ-U11
  it('renderiza el menú de plataforma (Empresas, Planes, Usuarios, Auditoría), no el de tenant', () => {
    renderSysadminChrome();

    expect(screen.getByRole('link', { name: 'Panel' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Empresas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Planes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Usuarios' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Auditoría' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ventas' })).not.toBeInTheDocument();
  });

  // spec:SPEC-008:REQ-X4
  it('nunca dispara una petición a GET /auth/permisos', async () => {
    let called = false;
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      called = true;
      throw { message: 'no debería llamarse', isAxiosError: true, config };
    }) as AxiosAdapter;

    renderSysadminChrome();
    // deja correr cualquier microtask pendiente que hubiera disparado la query
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(called).toBe(false);
  });

  // spec:SPEC-008:REQ-U14
  it('muestra el rol "Sysadmin" en el chip de usuario', () => {
    renderSysadminChrome();
    expect(screen.getByText('Sysadmin')).toBeInTheDocument();
  });
});
