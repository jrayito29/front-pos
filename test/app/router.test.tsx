import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AppRouter } from '../../src/app/router';
import { useSessionStore } from '../../src/stores/session.store';
import { apiClient } from '../../src/services/apiClient';
import { ROUTES } from '../../src/constants/routes';

// TenantChrome dispara tanto GET /auth/permisos (usePermisos) como GET /auth/perfil (usePerfil) al
// montar AppLayout — el mock de apiClient enruta por URL para que ninguno de los dos quede con una
// forma inesperada (ver TenantChrome.tsx, `perfil?.empresa?.nombre`).
function permisosYPerfilAdapter(): AxiosAdapter {
  return (async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
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
}

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  useSessionStore.getState().clearSession();
  vi.restoreAllMocks();
});

describe('AppRouter — code splitting (SPEC-006)', () => {
  // spec:SPEC-006:REQ-U1 / REQ-U3
  it('/login resuelve al componente real vía lazy(), sin romper el barrel síncrono de la feature', async () => {
    renderAt(ROUTES.LOGIN);

    expect(await screen.findByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  // spec:SPEC-006:REQ-U1
  it('/completar-perfil resuelve al wizard real vía lazy(), en un chunk independiente del de login', async () => {
    vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(true);
    useSessionStore.getState().setOnboardingSession({
      onboardingToken: 'onboarding-1',
      refreshToken: 'refresh-1',
      usuarioId: 'usuario-1',
    });

    renderAt(ROUTES.COMPLETAR_PERFIL);

    expect(await screen.findByLabelText('Nombre')).toBeInTheDocument();
  });

  // spec:SPEC-006:REQ-E1
  it('revisitar una ruta cuyo chunk ya se descargó no vuelve a mostrar el fallback de carga', async () => {
    // "Calienta" el chunk de /login con un primer render — React.lazy cachea la promesa del
    // import() a nivel de módulo, igual que el navegador cachea el chunk ya descargado.
    const { unmount } = renderAt(ROUTES.LOGIN);
    await screen.findByRole('button', { name: 'Iniciar sesión' });
    unmount();

    renderAt(ROUTES.LOGIN);

    // Si tuviera que re-suspender, lo único disponible de forma síncrona sería el fallback
    // (role="status"); al estar ya cacheado el import(), el botón real aparece directo.
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Cargando' })).not.toBeInTheDocument();
  });
});

describe('AppRouter — rutas protegidas dentro de AppLayout (SPEC-008)', () => {
  // spec:SPEC-008:REQ-U1
  it('/ (Dashboard) renderiza dentro del shell de AppLayout, con la sidebar tenant', async () => {
    vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(true);
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = permisosYPerfilAdapter();

    renderAt(ROUTES.DASHBOARD);

    expect(await screen.findByRole('link', { name: 'Panel' })).toBeInTheDocument();
  });

  // spec:SPEC-008:REQ-U12 (wiring real de RequirePermission por módulo)
  it('/ventas redirige a /no-autorizado cuando el módulo no está activo para el usuario', async () => {
    vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(true);
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = permisosYPerfilAdapter();

    renderAt(ROUTES.VENTAS);

    // RouteStub separa el texto en un nodo de texto + un <span> anidado (ver app/RouteStub.tsx);
    // getByText por defecto solo compara nodos de texto directos, así que se matchea el <span>.
    expect(await screen.findByText('Acceso no autorizado')).toBeInTheDocument();
  });

  // spec:SPEC-010:REQ-X3 — mismo criterio que /ventas, gate independiente de modulo.productos/inventario
  it('/categorias redirige a /no-autorizado cuando el módulo no está activo para el usuario', async () => {
    vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(true);
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = permisosYPerfilAdapter();

    renderAt(ROUTES.CATEGORIAS);

    expect(await screen.findByText('Acceso no autorizado')).toBeInTheDocument();
  });

  // spec:SPEC-011:REQ-X3 — wiring real de RequireRole (gate por rol estático, no RequirePermission)
  it('/usuarios redirige a /no-autorizado cuando el rol activo no es superadmin', async () => {
    vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(true);
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = permisosYPerfilAdapter();

    renderAt(ROUTES.USUARIOS);

    expect(await screen.findByText('Acceso no autorizado')).toBeInTheDocument();
  });

  // spec:SPEC-011:REQ-U1/U2 — con rol superadmin, /usuarios renderiza UsuariosListPage dentro del shell
  it('/usuarios renderiza UsuariosListPage cuando el rol activo es superadmin', async () => {
    vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(true);
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
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
      if (config.url === '/usuarios') {
        return { data: { success: true, data: [], meta: { page: 1, limit: 20, total: 0 } }, status: 200, statusText: 'OK', headers: {}, config };
      }
      return {
        data: { success: true, data: { userId: 'usuario-9', role: 'superadmin', accesoTotal: true, modulos: [] } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }) as AxiosAdapter;

    renderAt(ROUTES.USUARIOS);

    // Timeout ampliado (default 1000ms): a diferencia de /ventas o /categorias (RouteStub estático),
    // esta ruta resuelve un `React.lazy()` real (primera descarga del chunk de UsuariosListPage) más
    // dos peticiones secuenciales (permisos, usuarios) — bajo carga (suite completa en paralelo) el
    // timeout por defecto puede no alcanzar, aunque el flujo real sea correcto.
    expect(await screen.findByRole('heading', { name: 'Usuarios' }, { timeout: 5000 })).toBeInTheDocument();
  });
});
