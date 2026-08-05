import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { TenantChrome } from '../../../src/layouts/AppLayout/TenantChrome';
import { useSessionStore } from '../../../src/stores/session.store';
import { apiClient } from '../../../src/services/apiClient';
import { ROUTES } from '../../../src/constants/routes';
import type { ModuloEfectivo, PermisosEfectivosUsuario } from '../../../src/features/auth/types/permisos.types';
import type { PerfilUsuarioResponse } from '../../../src/features/auth/types/perfil.types';

const TODAS_LAS_CLAVES = [
  'modulo.ventas',
  'modulo.cotizaciones',
  'modulo.inventario',
  'modulo.productos',
  'modulo.almacenes',
  'modulo.clientes',
  'modulo.categorias',
];

function permisosFixture(activos: string[], accesoTotal = false): PermisosEfectivosUsuario {
  // RESPUESTA-003 — cuando accesoTotal es true, el backend siempre responde `modulos: []`.
  const modulos: ModuloEfectivo[] = accesoTotal
    ? []
    : TODAS_LAS_CLAVES.map((modulo) => ({
        modulo,
        activo: activos.includes(modulo),
        soloAdmin: false,
        fuenteModulo: 'plan',
        esOverrideModulo: false,
        acciones: [],
      }));
  return { userId: 'usuario-9', role: accesoTotal ? 'superadmin' : 'cajero', accesoTotal, modulos };
}

function perfilFixture(): PerfilUsuarioResponse {
  return { nombre: 'Ana García', empresa: { nombre: 'Distribuidora del Norte SA de CV', logoUrl: null } };
}

function okResponse(data: unknown, config: InternalAxiosRequestConfig): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config };
}

// TenantChrome dispara tanto GET /auth/permisos (usePermisos) como GET /auth/perfil (usePerfil) en
// el mismo montaje — el mock de apiClient enruta por URL.
function adapterFor(permisos: PermisosEfectivosUsuario): AxiosAdapter {
  return (async (config: InternalAxiosRequestConfig) => {
    if (config.url === '/auth/perfil') {
      return okResponse({ success: true, data: perfilFixture() }, config);
    }
    return okResponse({ success: true, data: permisos }, config);
  }) as AxiosAdapter;
}

function renderTenantChrome() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ROUTES.DASHBOARD]}>
        <Routes>
          <Route element={<TenantChrome />}>
            <Route path={ROUTES.DASHBOARD} element={<p>contenido panel</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => {
  useSessionStore.getState().clearSession();
});

describe('TenantChrome', () => {
  // spec:SPEC-008:REQ-S3
  it('muestra un skeleton en el nav mientras usePermisos() está cargando', () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = (() => new Promise(() => {})) as unknown as AxiosAdapter;

    renderTenantChrome();

    expect(screen.getByRole('status', { name: 'Cargando menú' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ventas' })).not.toBeInTheDocument();
  });

  // spec:SPEC-008:REQ-U10 / spec:SPEC-008:REQ-U12 / spec:SPEC-008:REQ-X2
  it('solo muestra en el menú los módulos activos para el usuario, Panel siempre visible', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = adapterFor(permisosFixture(['modulo.ventas', 'modulo.clientes']));

    renderTenantChrome();

    expect(await screen.findByRole('link', { name: 'Ventas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Panel' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clientes' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Cotizaciones' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Inventario' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Productos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Almacenes' })).not.toBeInTheDocument();
  });

  // spec:SPEC-008:REQ-U12 (RESPUESTA-003 — bug de accesoTotal para superadmin)
  it('con accesoTotal: true, muestra todos los módulos sin filtrar aunque `modulos` venga vacío', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = adapterFor(permisosFixture([], true));

    renderTenantChrome();

    expect(await screen.findByRole('link', { name: 'Ventas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cotizaciones' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inventario' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Productos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Almacenes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clientes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Categorías' })).toBeInTheDocument();
  });

  // spec:SPEC-010:REQ-U8 — el grupo "Configuración" se resuelve con el mismo criterio de permiso
  // que cualquier ítem plano, sobre su único sub-ítem hoy (Categorías).
  it('muestra el grupo "Configuración" con "Categorías" cuando el módulo está activo para el usuario', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = adapterFor(permisosFixture(['modulo.categorias']));

    renderTenantChrome();

    expect(await screen.findByRole('link', { name: 'Categorías' })).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  // spec:SPEC-010:REQ-U8 — un grupo sin ningún sub-ítem visible se oculta por completo (hoy
  // "Configuración" solo agrupa Categorías, así que perder ese permiso oculta el grupo entero).
  it('oculta el grupo "Configuración" por completo cuando ningún sub-ítem es visible para el usuario', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = adapterFor(permisosFixture(['modulo.ventas']));

    renderTenantChrome();

    expect(await screen.findByRole('link', { name: 'Ventas' })).toBeInTheDocument();
    expect(screen.queryByText('Configuración')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Categorías' })).not.toBeInTheDocument();
  });

  // spec:SPEC-008:REQ-X2 (fail-closed)
  it('ante un error del endpoint de permisos, no muestra ningún módulo restringido (fail-closed)', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      throw { message: 'boom', isAxiosError: true, config };
    }) as AxiosAdapter;

    renderTenantChrome();

    expect(await screen.findByRole('link', { name: 'Panel' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ventas' })).not.toBeInTheDocument();
  });

  // spec:SPEC-008:REQ-X3
  it('sin `role` resuelto todavía, el chip de usuario muestra un rótulo neutro (nunca vacío)', () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = (() => new Promise(() => {})) as unknown as AxiosAdapter;

    renderTenantChrome();

    expect(screen.getByText('Sesión activa')).toBeInTheDocument();
  });

  // spec:SPEC-008:REQ-U14 (RESPUESTA-003 — GET /auth/perfil)
  it('consume usePerfil() y muestra el nombre real del usuario y el nombre comercial de la empresa', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = adapterFor(permisosFixture(['modulo.ventas']));

    renderTenantChrome();

    expect(await screen.findByText('Ana García')).toBeInTheDocument();
    expect(screen.getByText('Distribuidora del Norte SA de CV')).toBeInTheDocument();
  });
});
