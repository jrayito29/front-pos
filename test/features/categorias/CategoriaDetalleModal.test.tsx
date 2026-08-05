import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoriaDetalleModal } from '../../../src/features/categorias/components/CategoriaDetalleModal';
import * as useCategoriaModule from '../../../src/features/categorias/hooks/useCategoria';
import * as useCategoriasSelectorModule from '../../../src/features/categorias/hooks/useCategoriasSelector';
import type { CategoriaDTO } from '../../../src/features/categorias/types/categoria.types';

function mockCategoria(data: CategoriaDTO | undefined, overrides: Partial<ReturnType<typeof useCategoriaModule.useCategoria>> = {}) {
  vi.spyOn(useCategoriaModule, 'useCategoria').mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    ...overrides,
  } as unknown as ReturnType<typeof useCategoriaModule.useCategoria>);
}

function mockRaices(raices: { id: string; nombre: string; padreId: string | null }[] = []) {
  vi.spyOn(useCategoriasSelectorModule, 'useCategoriasSelector').mockReturnValue({
    data: raices,
    isLoading: false,
  } as unknown as ReturnType<typeof useCategoriasSelectorModule.useCategoriasSelector>);
}

function raizConSubcategorias(): CategoriaDTO {
  return {
    id: 'cat-1',
    nombre: 'Ropa Dama',
    padreId: null,
    estado: 'ACTIVO',
    descripcion: 'Categoría de ropa para dama',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    subcategorias: [
      { id: 'sub-1', nombre: 'Blusas', estado: 'ACTIVO' },
      { id: 'sub-2', nombre: 'Faldas', estado: 'INACTIVO' },
    ],
  };
}

function raizSinSubcategorias(): CategoriaDTO {
  return { ...raizConSubcategorias(), id: 'cat-2', nombre: 'Pantalones', subcategorias: [] };
}

function subcategoria(): CategoriaDTO {
  return { ...raizConSubcategorias(), id: 'sub-1', nombre: 'Blusas', padreId: 'cat-1', subcategorias: [] };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CategoriaDetalleModal', () => {
  // spec:SPEC-010:REQ-S1
  it('muestra un skeleton mientras la categoría está cargando', () => {
    mockCategoria(undefined, { isLoading: true });
    mockRaices();

    render(
      <CategoriaDetalleModal
        categoriaId="cat-1"
        onClose={vi.fn()}
        onEditar={vi.fn()}
        onEliminar={vi.fn()}
        puedeEditar
        puedeEliminar
        puedeCambiarEstado={false}
      />
    );

    expect(screen.getByRole('status', { name: 'Cargando categoría' })).toBeInTheDocument();
  });

  // spec:SPEC-010:REQ-U6
  it('categoría raíz con subcategorías: muestra el desglose completo con el estado de cada una', () => {
    mockCategoria(raizConSubcategorias());
    mockRaices();

    render(
      <CategoriaDetalleModal
        categoriaId="cat-1"
        onClose={vi.fn()}
        onEditar={vi.fn()}
        onEliminar={vi.fn()}
        puedeEditar
        puedeEliminar
        puedeCambiarEstado={false}
      />
    );

    expect(screen.getByText('Subcategorías (2)')).toBeInTheDocument();
    expect(screen.getByText('Blusas')).toBeInTheDocument();
    expect(screen.getByText('Faldas')).toBeInTheDocument();
  });

  // spec:SPEC-010:REQ-U6 — estado vacío explícito
  it('categoría raíz sin subcategorías: muestra el estado vacío dedicado', () => {
    mockCategoria(raizSinSubcategorias());
    mockRaices();

    render(
      <CategoriaDetalleModal
        categoriaId="cat-2"
        onClose={vi.fn()}
        onEditar={vi.fn()}
        onEliminar={vi.fn()}
        puedeEditar
        puedeEliminar
        puedeCambiarEstado={false}
      />
    );

    expect(screen.getByText('Sin subcategorías.')).toBeInTheDocument();
  });

  // spec:SPEC-010:REQ-U6 — resuelve el nombre de la categoría padre por su id
  it('subcategoría: muestra el nombre de la categoría padre resuelto (no el id crudo)', () => {
    mockCategoria(subcategoria());
    mockRaices([{ id: 'cat-1', nombre: 'Ropa Dama', padreId: null }]);

    render(
      <CategoriaDetalleModal
        categoriaId="sub-1"
        onClose={vi.fn()}
        onEditar={vi.fn()}
        onEliminar={vi.fn()}
        puedeEditar
        puedeEliminar
        puedeCambiarEstado={false}
      />
    );

    expect(screen.getByText('Categoría padre:')).toBeInTheDocument();
    expect(screen.getByText('Ropa Dama')).toBeInTheDocument();
    expect(screen.queryByText('Subcategorías', { exact: false })).not.toBeInTheDocument();
  });

  it('categoría no encontrada: muestra el estado de error dedicado', () => {
    mockCategoria(undefined, { isError: true });
    mockRaices();

    render(
      <CategoriaDetalleModal
        categoriaId="cat-x"
        onClose={vi.fn()}
        onEditar={vi.fn()}
        onEliminar={vi.fn()}
        puedeEditar
        puedeEliminar
        puedeCambiarEstado={false}
      />
    );

    expect(screen.getByText('Categoría no encontrada')).toBeInTheDocument();
  });

  // spec:SPEC-010:REQ-E4
  it('clic en "Editar" invoca onEditar con la categoría cargada', async () => {
    mockCategoria(raizSinSubcategorias());
    mockRaices();
    const onEditar = vi.fn();
    const user = userEvent.setup();

    render(
      <CategoriaDetalleModal
        categoriaId="cat-2"
        onClose={vi.fn()}
        onEditar={onEditar}
        onEliminar={vi.fn()}
        puedeEditar
        puedeEliminar
        puedeCambiarEstado={false}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Editar' }));

    expect(onEditar).toHaveBeenCalledWith(expect.objectContaining({ id: 'cat-2' }));
  });

  // spec:SPEC-010:REQ-E5
  it('clic en "Eliminar" invoca onEliminar con la categoría cargada', async () => {
    mockCategoria(raizSinSubcategorias());
    mockRaices();
    const onEliminar = vi.fn();
    const user = userEvent.setup();

    render(
      <CategoriaDetalleModal
        categoriaId="cat-2"
        onClose={vi.fn()}
        onEditar={vi.fn()}
        onEliminar={onEliminar}
        puedeEditar
        puedeEliminar
        puedeCambiarEstado={false}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(onEliminar).toHaveBeenCalledWith(expect.objectContaining({ id: 'cat-2' }));
  });

  // spec:SPEC-010:REQ-S3 (adenda de header — mismo criterio que ProductoDetalleHeader)
  it('sin permiso de editar/eliminar, muestra botones "Bloqueado" en vez de las acciones', () => {
    mockCategoria(raizSinSubcategorias());
    mockRaices();

    render(
      <CategoriaDetalleModal
        categoriaId="cat-2"
        onClose={vi.fn()}
        onEditar={vi.fn()}
        onEliminar={vi.fn()}
        puedeEditar={false}
        puedeEliminar={false}
        puedeCambiarEstado={false}
      />
    );

    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
    // LockedActionButton usa `aria-label={reason}` (no el texto visible "Bloqueado") como nombre
    // accesible — CLAUDE.md §8, nunca "Acción no disponible" genérico.
    expect(screen.getByRole('button', { name: /No tienes permiso para editar categorías/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /No tienes permiso para eliminar categorías/ })).toBeInTheDocument();
  });
});
