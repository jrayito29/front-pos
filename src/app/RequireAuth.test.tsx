import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { RequireAuth } from './RequireAuth';
import { useSessionStore } from '../stores/session.store';
import { apiClient } from '../services/apiClient';
import { ROUTES } from '../constants/routes';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

function okResponse(data: unknown, config: InternalAxiosRequestConfig): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config };
}

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.DASHBOARD]}>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<p>pantalla de login</p>} />
        <Route element={<RequireAuth />}>
          <Route path={ROUTES.DASHBOARD} element={<p>dashboard</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  useSessionStore.getState().clearSession();
  vi.restoreAllMocks();
});

describe('RequireAuth', () => {
  // spec:SPEC-005:REQ-U4
  it('no redirige a /login mientras persist todavía no ha rehidratado', () => {
    vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(false);
    vi.spyOn(useSessionStore.persist, 'onFinishHydration').mockImplementation(() => () => {});

    renderGuard();

    expect(screen.getByRole('status', { name: 'Verificando sesión' })).toBeInTheDocument();
    expect(screen.queryByText('pantalla de login')).not.toBeInTheDocument();
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument();
  });

  it('redirige a /login cuando no hay accessToken ni refreshToken (ya rehidratado)', () => {
    vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(true);

    renderGuard();

    expect(screen.getByText('pantalla de login')).toBeInTheDocument();
  });

  it('renderiza el Outlet directo cuando ya hay accessToken en memoria', () => {
    vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(true);
    useSessionStore.getState().setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1' });

    renderGuard();

    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  // spec:SPEC-005:REQ-U5 / REQ-S1 / REQ-E1
  it('con refreshToken pero sin accessToken, muestra skeleton, refresca en silencio y renderiza el dashboard', async () => {
    vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(true);
    useSessionStore.setState({ refreshToken: 'refresh-1' });

    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      expect(config.url).toBe('/auth/refresh');
      return okResponse({ success: true, data: { accessToken: 'access-new' } }, config);
    }) as AxiosAdapter;

    renderGuard();

    expect(screen.getByRole('status', { name: 'Verificando sesión' })).toBeInTheDocument();

    expect(await screen.findByText('dashboard')).toBeInTheDocument();
    expect(useSessionStore.getState().accessToken).toBe('access-new');
  });

  // spec:SPEC-005:REQ-X1
  it('si el silent-refresh falla, limpia la sesión y redirige a /login sin toast', async () => {
    vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(true);
    useSessionStore.setState({ refreshToken: 'refresh-invalido' });

    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      throw { message: 'ERR_INVALID_REFRESH_TOKEN', isAxiosError: true, config };
    }) as AxiosAdapter;

    renderGuard();

    expect(await screen.findByText('pantalla de login')).toBeInTheDocument();
    expect(useSessionStore.getState().refreshToken).toBeNull();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
