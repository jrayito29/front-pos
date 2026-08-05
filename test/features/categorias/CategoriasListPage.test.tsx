import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoriasListPage } from '../../../src/features/categorias/pages/CategoriasListPage';
import * as usePermisosModule from '../../../src/features/auth/hooks/usePermisos';
import * as useCategoriasModule from '../../../src/features/categorias/hooks/useCategorias';
import * as useEliminarCategoriaModule from '../../../src/features/categorias/hooks/useEliminarCategoria';
import { ROUTES } from '../../../src/constants/routes';
import type { PermisosEfectivosUsuario } from '../../../src/features/auth/types/permisos.types';
import type { CategoriaResumenDTO } from '../../../src/features/categorias/types/categoria.types';

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

function mockCategorias(categorias: CategoriaResumenDTO[], total: number) {
  const spy = vi.spyOn(useCategoriasModule, 'useCategorias').mockReturnValue({
    data: { categorias, meta: { page: 1, limit: 20, total } },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCategoriasModule.useCategorias>);
  return spy;
}

const eliminarMutateMock = vi.fn();

function mockEliminar() {
  vi.spyOn(useEliminarCategoriaModule, 'useEliminarCategoria').mockReturnValue({
    mutate: eliminarMutateMock,
    isPending: false,
  } as unknown as ReturnType<typeof useEliminarCategoriaModule.useEliminarCategoria>);
}

function renderPage() {
  // `CategoriaFormModal`/`CategoriaDetalleModal` viven siempre montados (aunque cerrados, ver
  // Modal.tsx) y llaman a `useCrearCategoria`/`useActualizarCategoria`/`useCategoriasSelector`/
  // `useCategoria` internamente — necesitan un QueryClient real en contexto aunque no disparen
  // ninguna petición en estos tests.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ROUTES.CATEGORIAS]}>
        <Routes>
          <Route path={ROUTES.NO_AUTORIZADO} element={<p>no autorizado</p>} />
          <Route path={ROUTES.CATEGORIAS} element={<CategoriasListPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('CategoriasListPage', () => {
  // spec:SPEC-010:REQ-X3
  it('sin permiso `categorias.ver`, redirige a /no-autorizado y desactiva la query del listado', () => {
    mockPermisos(false);
    const spy = mockCategorias([], 0);
    mockEliminar();

    renderPage();

    expect(screen.getByText('no autorizado')).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ enabled: false }));
  });

  // spec:SPEC-010:REQ-X2
  it('sin categorías registradas (sin filtros), muestra el estado vacío dedicado con "Agregar"', () => {
    mockPermisos(true);
    mockCategorias([], 0);
    mockEliminar();

    renderPage();

    expect(screen.getByText('Aún no has registrado categorías')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Agregar/ })).toBeInTheDocument();
  });

  // spec:SPEC-010:REQ-X2 — distinto del caso anterior, nunca el mismo mensaje
  it('con búsqueda activa y sin resultados, muestra el estado vacío distinto ("Limpiar")', async () => {
    mockPermisos(true);
    mockCategorias([], 0);
    mockEliminar();
    const user = userEvent.setup();

    renderPage();
    await user.type(screen.getByLabelText('Buscar categorías'), 'zzz-sin-match');
    await new Promise((resolve) => setTimeout(resolve, 450));

    expect(await screen.findByText('No se encontraron categorías con estos filtros')).toBeInTheDocument();
    expect(screen.queryByText('Aún no has registrado categorías')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Limpiar' })).toBeInTheDocument();
  });

  // spec:SPEC-010:REQ-U3 — columnas del listado (Nombre con indicador de jerarquía, badge, estado)
  it('muestra una subcategoría con el prefijo visual y el badge "Subcategoría"', () => {
    mockPermisos(true);
    mockCategorias([{ id: 'sub-1', nombre: 'Blusas', padreId: 'cat-1', estado: 'ACTIVO' }], 1);
    mockEliminar();

    renderPage();

    expect(screen.getByText('Blusas')).toBeInTheDocument();
    expect(screen.getByText('Subcategoría')).toBeInTheDocument();
  });

  // spec:SPEC-010:REQ-E5
  it('clic en "Eliminar" de una fila abre la confirmación y, al confirmar, llama a la mutación con el id correcto', async () => {
    mockPermisos(true);
    mockCategorias([{ id: 'cat-9', nombre: 'Calzado', padreId: null, estado: 'ACTIVO' }], 1);
    mockEliminar();
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole('button', { name: 'Eliminar Calzado' }));

    expect(await screen.findByRole('heading', { name: 'Eliminar categoría' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(eliminarMutateMock).toHaveBeenCalledWith('cat-9', expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }));
  });

  // spec:SPEC-010:REQ-X1
  it('si el listado falla, no renderiza la tabla — muestra el bloque de error con "Reintentar"', () => {
    mockPermisos(true);
    const refetchMock = vi.fn();
    vi.spyOn(useCategoriasModule, 'useCategorias').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: refetchMock,
    } as unknown as ReturnType<typeof useCategoriasModule.useCategorias>);
    mockEliminar();

    renderPage();

    expect(screen.getByText('No se pudo cargar el listado')).toBeInTheDocument();
    expect(screen.queryByText('Blusas')).not.toBeInTheDocument();
  });
});
