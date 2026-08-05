import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoriaFormModal } from '../../../src/features/categorias/components/CategoriaFormModal';
import * as useCrearCategoriaModule from '../../../src/features/categorias/hooks/useCrearCategoria';
import * as useActualizarCategoriaModule from '../../../src/features/categorias/hooks/useActualizarCategoria';
import * as useCategoriasSelectorModule from '../../../src/features/categorias/hooks/useCategoriasSelector';
import type { CategoriaDTO } from '../../../src/features/categorias/types/categoria.types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const crearMutateMock = vi.fn();
const actualizarMutateMock = vi.fn();

function mockHooks() {
  vi.spyOn(useCrearCategoriaModule, 'useCrearCategoria').mockReturnValue({
    mutate: crearMutateMock,
    isPending: false,
  } as unknown as ReturnType<typeof useCrearCategoriaModule.useCrearCategoria>);
  vi.spyOn(useActualizarCategoriaModule, 'useActualizarCategoria').mockReturnValue({
    mutate: actualizarMutateMock,
    isPending: false,
  } as unknown as ReturnType<typeof useActualizarCategoriaModule.useActualizarCategoria>);
  vi.spyOn(useCategoriasSelectorModule, 'useCategoriasSelector').mockReturnValue({
    data: [{ id: 'raiz-1', nombre: 'Ropa Dama', padreId: null }],
    isLoading: false,
  } as unknown as ReturnType<typeof useCategoriasSelectorModule.useCategoriasSelector>);
}

function categoriaEditable(): CategoriaDTO {
  return {
    id: 'cat-2',
    nombre: 'Pantalones',
    padreId: null,
    estado: 'ACTIVO',
    descripcion: 'Pantalones de vestir y casuales',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    subcategorias: [],
  };
}

function categoriaConSubcategoriasActivas(): CategoriaDTO {
  return { ...categoriaEditable(), id: 'cat-1', nombre: 'Ropa Dama', subcategorias: [{ id: 'sub-1', nombre: 'Blusas', estado: 'ACTIVO' }] };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('CategoriaFormModal', () => {
  // spec:SPEC-010:REQ-U4
  it('modo crear: título "Nueva categoría" y el campo Nombre inicia vacío', () => {
    mockHooks();
    render(<CategoriaFormModal isOpen mode="crear" onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Nueva categoría' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre', { exact: false })).toHaveValue('');
  });

  // spec:SPEC-010:REQ-U4
  it('modo editar: título incluye el nombre actual y el formulario se precarga con los datos existentes', () => {
    mockHooks();
    render(<CategoriaFormModal isOpen mode="editar" categoria={categoriaEditable()} onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Editar Pantalones' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre', { exact: false })).toHaveValue('Pantalones');
    expect(screen.getByLabelText('Descripción')).toHaveValue('Pantalones de vestir y casuales');
  });

  // spec:SPEC-010:REQ-U5 / REQ-S2
  it('editar una categoría con subcategorías activas bloquea el switch "Es subcategoría" y muestra la nota', async () => {
    mockHooks();
    const user = userEvent.setup();
    render(<CategoriaFormModal isOpen mode="editar" categoria={categoriaConSubcategoriasActivas()} onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(screen.getByText(/no puede convertirse en subcategoría de otra/)).toBeInTheDocument();
    const switchEl = screen.getByRole('switch', { name: 'Es subcategoría de otra categoría' });
    expect(switchEl).toHaveAttribute('aria-checked', 'false');

    await user.click(switchEl);

    // El click no debe habilitar el modo subcategoría (handler corta temprano, REQ-U5).
    expect(switchEl).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByLabelText('Categoría padre')).not.toBeInTheDocument();
  });

  // spec:SPEC-010:REQ-U4 — crear una categoría raíz (sin activar "Es subcategoría")
  it('crear: envía nombre/descripción y padreId undefined cuando no se activa "Es subcategoría"', async () => {
    mockHooks();
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSaved = vi.fn();
    crearMutateMock.mockImplementation((_payload, options) => {
      options.onSuccess({ id: 'cat-nueva', nombre: 'Accesorios', padreId: null, estado: 'ACTIVO', descripcion: null, createdAt: '', updatedAt: '', subcategorias: [] });
    });

    render(<CategoriaFormModal isOpen mode="crear" onClose={onClose} onSaved={onSaved} />);
    await user.type(screen.getByLabelText('Nombre', { exact: false }), 'Accesorios');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(crearMutateMock).toHaveBeenCalledWith(
      { nombre: 'Accesorios', descripcion: undefined, padreId: undefined },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ id: 'cat-nueva' }));
    expect(onClose).toHaveBeenCalled();
  });

  // spec:SPEC-010:REQ-U4 — editar mueve padreId a null cuando "Es subcategoría" está desactivado
  it('editar: si "Es subcategoría" está desactivado, envía padreId: null (mover a raíz)', async () => {
    mockHooks();
    const user = userEvent.setup();
    actualizarMutateMock.mockImplementation((_vars, options) => {
      options.onSuccess({ ...categoriaEditable(), nombre: 'Pantalones' });
    });

    render(<CategoriaFormModal isOpen mode="editar" categoria={categoriaEditable()} onClose={vi.fn()} onSaved={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(actualizarMutateMock).toHaveBeenCalledWith(
      { id: 'cat-2', payload: { nombre: 'Pantalones', descripcion: 'Pantalones de vestir y casuales', padreId: null } },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  // spec:SPEC-010:REQ-X4
  it('nombre duplicado: ancla el error al campo Nombre en vez de mostrar solo un toast', async () => {
    mockHooks();
    const user = userEvent.setup();
    crearMutateMock.mockImplementation((_payload, options) => {
      options.onError({ code: 'ERR_CATEGORIA_NOMBRE_DUPLICADO', message: 'Ya existe una categoría con ese nombre' });
    });

    render(<CategoriaFormModal isOpen mode="crear" onClose={vi.fn()} onSaved={vi.fn()} />);
    await user.type(screen.getByLabelText('Nombre', { exact: false }), 'Ropa Dama');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Ya existe una categoría con ese nombre')).toBeInTheDocument();
  });
});
