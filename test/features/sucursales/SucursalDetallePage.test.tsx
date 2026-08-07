import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SucursalDetallePage } from '../../../src/features/sucursales/pages/SucursalDetallePage';
import * as usePermisosModule from '../../../src/features/auth/hooks/usePermisos';
import * as useSucursalModule from '../../../src/features/sucursales/hooks/useSucursal';
import * as useAlmacenesDeSucursalModule from '../../../src/features/sucursales/hooks/useAlmacenesDeSucursal';
import { ROUTES, sucursalDetalleRoute } from '../../../src/constants/routes';
import type { PermisosEfectivosUsuario } from '../../../src/features/auth/types/permisos.types';
import type { SucursalConAlmacenesDTO } from '../../../src/features/sucursales/types/sucursal.types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function permisosFixture(accesoTotal: boolean): PermisosEfectivosUsuario {
  return { userId: 'usuario-9', role: accesoTotal ? 'superadmin' : 'cajero', accesoTotal, modulos: [] };
}

function mockPermisos(overrides: Partial<PermisosEfectivosUsuario> | { isLoading: true }) {
  if ('isLoading' in overrides && overrides.isLoading) {
    vi.spyOn(usePermisosModule, 'usePermisos').mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof usePermisosModule.usePermisos>);
    return;
  }
  vi.spyOn(usePermisosModule, 'usePermisos').mockReturnValue({
    data: { ...permisosFixture(true), ...overrides },
    isLoading: false,
  } as unknown as ReturnType<typeof usePermisosModule.usePermisos>);
}

function sucursalFixture(overrides: Partial<SucursalConAlmacenesDTO> = {}): SucursalConAlmacenesDTO {
  return {
    id: 'suc-1',
    nombre: 'Sucursal Centro',
    codigoInterno: 'SUC-0001',
    codigoPersonalizable: null,
    telefono: null,
    email: null,
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
    almacenes: [{ id: 'alm-1', nombre: 'Almacén de Ventas', tipo: 'VENTAS', codigoInterno: 'ALM-0001', codigoPersonalizable: null, permitirVenta: true, permitirTraspaso: true, esVirtual: false, activo: true }],
    ...overrides,
  };
}

function mockSucursal(overrides: Partial<ReturnType<typeof useSucursalModule.useSucursal>> & { data?: SucursalConAlmacenesDTO | null } = {}) {
  vi.spyOn(useSucursalModule, 'useSucursal').mockReturnValue({
    data: sucursalFixture(),
    isLoading: false,
    isError: false,
    ...overrides,
  } as unknown as ReturnType<typeof useSucursalModule.useSucursal>);
}

function mockAlmacenes() {
  vi.spyOn(useAlmacenesDeSucursalModule, 'useAlmacenesDeSucursal').mockReturnValue({
    data: { almacenes: [], meta: { page: 1, limit: 20, total: 0 } },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useAlmacenesDeSucursalModule.useAlmacenesDeSucursal>);
}

function renderPage(id = 'suc-1') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[sucursalDetalleRoute(id)]}>
        <Routes>
          <Route path={ROUTES.NO_AUTORIZADO} element={<p>no autorizado</p>} />
          <Route path={ROUTES.SUCURSALES} element={<p>listado de sucursales</p>} />
          <Route path={ROUTES.SUCURSALES_DETALLE} element={<SucursalDetallePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('SucursalDetallePage', () => {
  // spec:SPEC-012:REQ-S1
  it('muestra un skeleton mientras se resuelve el permiso, antes de decidir redirigir', () => {
    mockPermisos({ isLoading: true } as { isLoading: true });
    mockSucursal();
    mockAlmacenes();

    renderPage();

    expect(screen.getByRole('status', { name: 'Verificando permisos' })).toBeInTheDocument();
  });

  // spec:SPEC-012:REQ-X3
  it('sin permiso `sucursales.ver`, redirige a /no-autorizado', () => {
    mockPermisos({ accesoTotal: false, modulos: [] });
    mockSucursal();
    mockAlmacenes();

    renderPage();

    expect(screen.getByText('no autorizado')).toBeInTheDocument();
  });

  it('muestra un skeleton mientras carga la sucursal', () => {
    mockPermisos({});
    mockSucursal({ isLoading: true, data: undefined });
    mockAlmacenes();

    renderPage();

    expect(screen.getByRole('status', { name: 'Cargando sucursal' })).toBeInTheDocument();
  });

  // spec:SPEC-012:REQ-X8
  it('si la sucursal no existe (404), muestra el estado vacío dedicado en vez de un formulario vacío', () => {
    mockPermisos({});
    mockSucursal({ isError: true, data: undefined });
    mockAlmacenes();

    renderPage();

    expect(screen.getByText('Sucursal no encontrada')).toBeInTheDocument();
  });

  // spec:SPEC-012:REQ-U6/U7 — header, tabs con el conteo de almacenes activos embebido
  it('muestra el nombre, el código y ambas tabs con el conteo de almacenes', () => {
    mockPermisos({});
    mockSucursal();
    mockAlmacenes();

    renderPage();

    expect(screen.getByRole('heading', { name: 'Sucursal Centro' })).toBeInTheDocument();
    expect(screen.getByText('SUC-0001')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Información general' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Almacenes (1)' })).toBeInTheDocument();
  });

  // spec:SPEC-012:REQ-U7 — clic en la tab Almacenes muestra la tabla real (SucursalAlmacenesTab)
  it('cambiar a la tab Almacenes muestra su contenido (toolbar de búsqueda)', async () => {
    mockPermisos({});
    mockSucursal();
    mockAlmacenes();
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole('tab', { name: 'Almacenes (1)' }));

    expect(await screen.findByLabelText('Buscar almacenes')).toBeInTheDocument();
  });

  // spec:SPEC-012:REQ-S4 — sucursal inactiva: "Agregar almacén" deshabilitado
  it('con la sucursal inactiva, el botón "Agregar" de la tab Almacenes está deshabilitado', async () => {
    mockPermisos({});
    mockSucursal({ data: sucursalFixture({ activo: false }) });
    mockAlmacenes();
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole('tab', { name: 'Almacenes (1)' }));

    expect(await screen.findByRole('button', { name: /Agregar/ })).toBeDisabled();
  });
});
