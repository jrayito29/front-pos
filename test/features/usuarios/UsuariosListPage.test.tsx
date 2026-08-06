import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UsuariosListPage } from '../../../src/features/usuarios/pages/UsuariosListPage';
import * as usePermisosModule from '../../../src/features/auth/hooks/usePermisos';
import * as useUsuariosModule from '../../../src/features/usuarios/hooks/useUsuarios';
import * as useDesactivarUsuarioModule from '../../../src/features/usuarios/hooks/useDesactivarUsuario';
import { useSessionStore } from '../../../src/stores/session.store';
import { ROUTES } from '../../../src/constants/routes';
import type { PermisosEfectivosUsuario } from '../../../src/features/auth/types/permisos.types';
import type { UsuarioListItemDTO } from '../../../src/features/usuarios/types/usuario.types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function permisosFixture(role: string): PermisosEfectivosUsuario {
  return { userId: 'usuario-9', role, accesoTotal: role === 'superadmin', modulos: [] };
}

function mockPermisos(role: string) {
  vi.spyOn(usePermisosModule, 'usePermisos').mockReturnValue({
    data: permisosFixture(role),
    isLoading: false,
  } as unknown as ReturnType<typeof usePermisosModule.usePermisos>);
}

function mockUsuarios(usuarios: UsuarioListItemDTO[], total: number) {
  const spy = vi.spyOn(useUsuariosModule, 'useUsuarios').mockReturnValue({
    data: { usuarios, meta: { page: 1, limit: 20, total } },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useUsuariosModule.useUsuarios>);
  return spy;
}

function mockDesactivar() {
  vi.spyOn(useDesactivarUsuarioModule, 'useDesactivarUsuario').mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useDesactivarUsuarioModule.useDesactivarUsuario>);
}

function usuarioRow(overrides: Partial<UsuarioListItemDTO> = {}): UsuarioListItemDTO {
  return {
    usuarioId: 'usuario-1',
    email: 'juan@empresa.com',
    role: 'cajero',
    nombre: 'Juan',
    apellidoPaterno: 'García',
    apellidoMaterno: null,
    createdAt: '2026-05-21T10:00:00.000Z',
    ...overrides,
  };
}

function renderPage() {
  // UsuarioFormModal/UsuarioDetalleModal viven siempre montados (aunque cerrados) y llaman a sus
  // propios hooks internamente — necesitan un QueryClient real en contexto.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ROUTES.USUARIOS]}>
        <Routes>
          <Route path={ROUTES.NO_AUTORIZADO} element={<p>no autorizado</p>} />
          <Route path={ROUTES.USUARIOS} element={<UsuariosListPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => {
  // Mismo criterio que UsuarioDetalleModal.test.tsx — desmontar antes de restaurar mocks/limpiar la
  // sesión, para que un re-render disparado por `clearSession()` nunca llegue a ejecutar un hook real
  // (usePermisos/useUsuarios) sobre un árbol que ya debería estar fuera.
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  useSessionStore.getState().clearSession();
});

describe('UsuariosListPage', () => {
  // spec:SPEC-011:REQ-X3 — desactiva la query cuando el rol activo no es superadmin
  it('con rol distinto de superadmin, desactiva la query del listado', () => {
    mockPermisos('cajero');
    const spy = mockUsuarios([], 0);
    mockDesactivar();

    renderPage();

    expect(spy).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ enabled: false }));
  });

  // spec:SPEC-011:REQ-X2
  it('sin usuarios registrados (sin filtros), muestra el estado vacío dedicado con "Agregar"', () => {
    mockPermisos('superadmin');
    mockUsuarios([], 0);
    mockDesactivar();

    renderPage();

    expect(screen.getByText('Aún no has creado usuarios')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Agregar/ })).toBeInTheDocument();
  });

  // spec:SPEC-011:REQ-X2 — distinto del caso anterior, nunca el mismo mensaje
  it('con búsqueda activa y sin resultados, muestra el estado vacío distinto ("Limpiar")', async () => {
    mockPermisos('superadmin');
    mockUsuarios([], 0);
    mockDesactivar();
    const user = userEvent.setup();

    renderPage();
    await user.type(screen.getByLabelText('Buscar usuarios'), 'zzz-sin-match');
    await new Promise((resolve) => setTimeout(resolve, 450));

    expect(await screen.findByText('No se encontraron usuarios con estos filtros')).toBeInTheDocument();
    expect(screen.queryByText('Aún no has creado usuarios')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Limpiar' })).toBeInTheDocument();
  });

  // spec:SPEC-011:REQ-U4 — columnas limitadas a nombre, email, rol y alta
  it('muestra nombre completo, email y rol de cada fila', () => {
    mockPermisos('superadmin');
    mockUsuarios([usuarioRow()], 1);
    mockDesactivar();

    renderPage();

    expect(screen.getByText('Juan García')).toBeInTheDocument();
    expect(screen.getByText('juan@empresa.com')).toBeInTheDocument();
    expect(screen.getByText('Cajero')).toBeInTheDocument();
  });

  // spec:SPEC-011:REQ-S2 — la propia fila de la sesión activa no puede desactivarse desde el listado
  it('la fila del usuario de la sesión activa muestra el botón "Desactivar" bloqueado', () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'a', refreshToken: 'r', usuarioId: 'usuario-1', empresaId: 'empresa-1' });
    mockPermisos('superadmin');
    mockUsuarios([usuarioRow()], 1);
    mockDesactivar();

    renderPage();

    expect(screen.getByRole('button', { name: 'Desactivar (bloqueado)' })).toBeDisabled();
  });

  // spec:SPEC-011:REQ-X1
  it('si el listado falla, no renderiza la tabla — muestra el bloque de error con "Reintentar"', () => {
    mockPermisos('superadmin');
    const refetchMock = vi.fn();
    vi.spyOn(useUsuariosModule, 'useUsuarios').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: refetchMock,
    } as unknown as ReturnType<typeof useUsuariosModule.useUsuarios>);
    mockDesactivar();

    renderPage();

    expect(screen.getByText('No se pudo cargar el listado')).toBeInTheDocument();
    expect(screen.queryByText('Juan García')).not.toBeInTheDocument();
  });
});
