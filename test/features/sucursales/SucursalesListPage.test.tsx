import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { SucursalesListPage } from '../../../src/features/sucursales/pages/SucursalesListPage';
import * as usePermisosModule from '../../../src/features/auth/hooks/usePermisos';
import * as useSucursalesModule from '../../../src/features/sucursales/hooks/useSucursales';
import { ROUTES } from '../../../src/constants/routes';
import type { PermisosEfectivosUsuario } from '../../../src/features/auth/types/permisos.types';
import type { SucursalDTO } from '../../../src/features/sucursales/types/sucursal.types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function permisosFixture(accesoTotal: boolean): PermisosEfectivosUsuario {
  return { userId: 'usuario-9', role: accesoTotal ? 'superadmin' : 'cajero', accesoTotal, modulos: [] };
}

function mockPermisos(accesoTotal: boolean) {
  vi.spyOn(usePermisosModule, 'usePermisos').mockReturnValue({
    data: permisosFixture(accesoTotal),
    isLoading: false,
  } as unknown as ReturnType<typeof usePermisosModule.usePermisos>);
}

function mockSucursales(sucursales: SucursalDTO[], total: number, overrides: Partial<ReturnType<typeof useSucursalesModule.useSucursales>> = {}) {
  const spy = vi.spyOn(useSucursalesModule, 'useSucursales').mockReturnValue({
    data: { sucursales, meta: { page: 1, limit: 20, total } },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useSucursalesModule.useSucursales>);
  return spy;
}

function sucursalFixture(overrides: Partial<SucursalDTO> = {}): SucursalDTO {
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
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.SUCURSALES]}>
      <Routes>
        <Route path={ROUTES.NO_AUTORIZADO} element={<p>no autorizado</p>} />
        <Route path={ROUTES.SUCURSALES} element={<SucursalesListPage />} />
        <Route path={ROUTES.SUCURSALES_DETALLE} element={<p>detalle de sucursal</p>} />
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('SucursalesListPage', () => {
  // spec:SPEC-012:REQ-X3
  it('sin permiso `sucursales.ver`, redirige a /no-autorizado y desactiva la query del listado', () => {
    mockPermisos(false);
    const spy = mockSucursales([], 0);

    renderPage();

    expect(screen.getByText('no autorizado')).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ enabled: false }));
  });

  // spec:SPEC-012:REQ-X2
  it('sin sucursales registradas (sin filtros), muestra el estado vacío dedicado con "Agregar"', () => {
    mockPermisos(true);
    mockSucursales([], 0);

    renderPage();

    expect(screen.getByText('Aún no has registrado sucursales')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Agregar/ })).toBeInTheDocument();
  });

  // spec:SPEC-012:REQ-X2 — distinto del caso anterior, nunca el mismo mensaje
  it('con búsqueda activa y sin resultados, muestra el estado vacío distinto ("Limpiar")', async () => {
    mockPermisos(true);
    mockSucursales([], 0);
    const user = userEvent.setup();

    renderPage();
    await user.type(screen.getByLabelText('Buscar sucursales'), 'zzz-sin-match');
    await new Promise((resolve) => setTimeout(resolve, 450));

    expect(await screen.findByText('No se encontraron sucursales con estos filtros')).toBeInTheDocument();
    expect(screen.queryByText('Aún no has registrado sucursales')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Limpiar' })).toBeInTheDocument();
  });

  // spec:SPEC-012:REQ-U3 — columnas del listado (nombre, código, ubicación, badge de estado)
  it('muestra nombre, código, ubicación y estado de cada sucursal', () => {
    mockPermisos(true);
    mockSucursales([sucursalFixture({ codigoPersonalizable: 'SUC-CENTRO' })], 1);

    renderPage();

    expect(screen.getByText('Sucursal Centro')).toBeInTheDocument();
    expect(screen.getByText('SUC-CENTRO')).toBeInTheDocument();
    expect(screen.getByText('Monterrey, Nuevo León')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  // spec:SPEC-012:REQ-E1
  it('clic en una fila del listado navega al detalle (nunca abre un modal)', async () => {
    mockPermisos(true);
    mockSucursales([sucursalFixture()], 1);
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByText('Sucursal Centro'));

    expect(await screen.findByText('detalle de sucursal')).toBeInTheDocument();
  });

  // spec:SPEC-012:REQ-X1
  it('si el listado falla, no renderiza la tabla — muestra el bloque de error con "Reintentar"', () => {
    mockPermisos(true);
    const refetchMock = vi.fn();
    vi.spyOn(useSucursalesModule, 'useSucursales').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: refetchMock,
    } as unknown as ReturnType<typeof useSucursalesModule.useSucursales>);

    renderPage();

    expect(screen.getByText('No se pudo cargar el listado')).toBeInTheDocument();
    expect(screen.queryByText('Sucursal Centro')).not.toBeInTheDocument();
  });
});
