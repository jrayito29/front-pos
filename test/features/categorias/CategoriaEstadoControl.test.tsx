import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoriaEstadoControl } from '../../../src/features/categorias/components/CategoriaEstadoControl';
import * as useCambiarEstadoCategoriaModule from '../../../src/features/categorias/hooks/useCambiarEstadoCategoria';
import type { CategoriaDTO } from '../../../src/features/categorias/types/categoria.types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mutateMock = vi.fn();

function mockHook() {
  vi.spyOn(useCambiarEstadoCategoriaModule, 'useCambiarEstadoCategoria').mockReturnValue({
    mutate: mutateMock,
    isPending: false,
  } as unknown as ReturnType<typeof useCambiarEstadoCategoriaModule.useCambiarEstadoCategoria>);
}

function raizConSubcategoriasActivas(): CategoriaDTO {
  return {
    id: 'cat-1',
    nombre: 'Ropa Dama',
    padreId: null,
    estado: 'ACTIVO',
    descripcion: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    subcategorias: [
      { id: 'sub-1', nombre: 'Blusas', estado: 'ACTIVO' },
      { id: 'sub-2', nombre: 'Faldas', estado: 'ACTIVO' },
      { id: 'sub-3', nombre: 'Pantalones', estado: 'INACTIVO' },
    ],
  };
}

function raizSinSubcategoriasActivas(): CategoriaDTO {
  return { ...raizConSubcategoriasActivas(), subcategorias: [] };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('CategoriaEstadoControl', () => {
  // spec:SPEC-010:REQ-S3
  it('sin permiso de cambiar estado, muestra solo el badge de solo lectura (sin Switch)', () => {
    mockHook();
    render(<CategoriaEstadoControl categoria={raizConSubcategoriasActivas()} puedeCambiarEstado={false} />);

    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  // spec:SPEC-010:REQ-E3 — reactivar o desactivar sin subcategorías activas se aplica de inmediato
  it('desactivar una categoría sin subcategorías activas aplica el cambio de inmediato, sin modal', async () => {
    mockHook();
    const user = userEvent.setup();
    render(<CategoriaEstadoControl categoria={raizSinSubcategoriasActivas()} puedeCambiarEstado />);

    await user.click(screen.getByRole('switch', { name: 'Categoría activa' }));

    expect(mutateMock).toHaveBeenCalledWith(
      { id: 'cat-1', estado: 'INACTIVO', confirmarCascada: false },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
    expect(screen.queryByText('Desactivar categoría con subcategorías')).not.toBeInTheDocument();
  });

  // spec:SPEC-010:REQ-E2 — desactivar una raíz con subcategorías activas exige confirmación previa
  it('desactivar una raíz con subcategorías activas muestra el modal de confirmación con el conteo exacto', async () => {
    mockHook();
    const user = userEvent.setup();
    render(<CategoriaEstadoControl categoria={raizConSubcategoriasActivas()} puedeCambiarEstado />);

    await user.click(screen.getByRole('switch', { name: 'Categoría activa' }));

    expect(await screen.findByText('Desactivar categoría con subcategorías')).toBeInTheDocument();
    // Solo cuenta las 2 subcategorías ACTIVAS, no la INACTIVA.
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('subcategorías activas.', { exact: false })).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  // spec:SPEC-010:REQ-E2 — confirmar la cascada llama a la mutación con confirmarCascada: true
  it('confirmar el modal llama a la mutación con confirmarCascada: true', async () => {
    mockHook();
    const user = userEvent.setup();
    render(<CategoriaEstadoControl categoria={raizConSubcategoriasActivas()} puedeCambiarEstado />);

    await user.click(screen.getByRole('switch', { name: 'Categoría activa' }));
    await user.click(await screen.findByRole('button', { name: 'Desactivar' }));

    expect(mutateMock).toHaveBeenCalledWith(
      { id: 'cat-1', estado: 'INACTIVO', confirmarCascada: true },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  // spec:SPEC-010:REQ-X6 — cerrar el modal sin confirmar no ejecuta la mutación
  it('cancelar el modal de cascada no ejecuta la mutación', async () => {
    mockHook();
    const user = userEvent.setup();
    render(<CategoriaEstadoControl categoria={raizConSubcategoriasActivas()} puedeCambiarEstado />);

    await user.click(screen.getByRole('switch', { name: 'Categoría activa' }));
    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));

    expect(mutateMock).not.toHaveBeenCalled();
  });

  // spec:SPEC-010:REQ-E6c — reactivar (ACTIVO) nunca pasa por el modal de cascada
  it('reactivar una categoría inactiva se aplica de inmediato, sin modal', async () => {
    mockHook();
    const user = userEvent.setup();
    const inactiva: CategoriaDTO = { ...raizConSubcategoriasActivas(), estado: 'INACTIVO' };
    render(<CategoriaEstadoControl categoria={inactiva} puedeCambiarEstado />);

    await user.click(screen.getByRole('switch', { name: 'Categoría activa' }));

    expect(mutateMock).toHaveBeenCalledWith(
      { id: 'cat-1', estado: 'ACTIVO', confirmarCascada: false },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });
});
