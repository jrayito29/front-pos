import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsuarioDetalleModal } from '../../../src/features/usuarios/components/UsuarioDetalleModal';
import * as useUsuarioModule from '../../../src/features/usuarios/hooks/useUsuario';
import * as useCambiarRolUsuarioModule from '../../../src/features/usuarios/hooks/useCambiarRolUsuario';
import { useSessionStore } from '../../../src/stores/session.store';
import type { UsuarioDetalleDTO } from '../../../src/features/usuarios/types/usuario.types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function mockUsuario(data: UsuarioDetalleDTO | undefined, overrides: Partial<ReturnType<typeof useUsuarioModule.useUsuario>> = {}) {
  vi.spyOn(useUsuarioModule, 'useUsuario').mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    ...overrides,
  } as unknown as ReturnType<typeof useUsuarioModule.useUsuario>);
}

function mockCambiarRol() {
  vi.spyOn(useCambiarRolUsuarioModule, 'useCambiarRolUsuario').mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCambiarRolUsuarioModule.useCambiarRolUsuario>);
}

function usuarioFixture(overrides: Partial<UsuarioDetalleDTO> = {}): UsuarioDetalleDTO {
  return {
    usuarioId: 'usuario-1',
    email: 'juan@empresa.com',
    role: 'cajero',
    perfil: { nombre: 'Juan', apellidoPaterno: 'García', apellidoMaterno: null, telefono: '55-1234-5678' },
    createdAt: '2026-05-21T10:00:00.000Z',
    ...overrides,
  };
}

afterEach(() => {
  // Desmontar ANTES de restaurar mocks/limpiar la sesión: `useSessionStore` es un singleton real
  // (no mockeado) que este componente sí lee — si `clearSession()` notificara a un árbol todavía
  // montado tras `vi.restoreAllMocks()`, el re-render usaría el `useUsuario` real (sin
  // QueryClientProvider en este test) y reventaría. `cleanup()` explícito no depende del orden de
  // registro entre el afterEach automático de RTL y este.
  cleanup();
  vi.restoreAllMocks();
  useSessionStore.getState().clearSession();
});

describe('UsuarioDetalleModal', () => {
  // spec:SPEC-011:REQ-S1
  it('muestra un skeleton mientras el usuario está cargando', () => {
    mockUsuario(undefined, { isLoading: true });
    mockCambiarRol();

    render(<UsuarioDetalleModal usuarioId="usuario-1" onClose={vi.fn()} onDesactivar={vi.fn()} />);

    expect(screen.getByRole('status', { name: 'Cargando usuario' })).toBeInTheDocument();
  });

  it('usuario no encontrado: muestra el estado de error dedicado', () => {
    mockUsuario(undefined, { isError: true });
    mockCambiarRol();

    render(<UsuarioDetalleModal usuarioId="usuario-x" onClose={vi.fn()} onDesactivar={vi.fn()} />);

    expect(screen.getByText('Usuario no encontrado')).toBeInTheDocument();
  });

  // spec:SPEC-011:REQ-E1 — muestra el teléfono, exclusivo de UsuarioDetalleDTO
  it('muestra el email y el teléfono del perfil', () => {
    mockUsuario(usuarioFixture());
    mockCambiarRol();

    render(<UsuarioDetalleModal usuarioId="usuario-1" onClose={vi.fn()} onDesactivar={vi.fn()} />);

    expect(screen.getByText('juan@empresa.com')).toBeInTheDocument();
    expect(screen.getByText('55-1234-5678')).toBeInTheDocument();
  });

  // spec:SPEC-011:REQ-S2 — autodesactivación bloqueada preventivamente en UI
  it('cuando el usuario en detalle es el de la sesión activa, oculta "Desactivar" y muestra la nota', () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'a', refreshToken: 'r', usuarioId: 'usuario-1', empresaId: 'empresa-1' });
    mockUsuario(usuarioFixture());
    mockCambiarRol();

    render(<UsuarioDetalleModal usuarioId="usuario-1" onClose={vi.fn()} onDesactivar={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Desactivar' })).not.toBeInTheDocument();
    expect(screen.getByText('No puedes desactivar tu propia cuenta.')).toBeInTheDocument();
  });

  // spec:SPEC-011:REQ-S2 — otro usuario distinto de la sesión sí puede desactivarse
  it('clic en "Desactivar" invoca onDesactivar con el usuario cargado (usuario distinto al de la sesión)', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'a', refreshToken: 'r', usuarioId: 'usuario-9', empresaId: 'empresa-1' });
    mockUsuario(usuarioFixture());
    mockCambiarRol();
    const onDesactivar = vi.fn();
    const user = userEvent.setup();

    render(<UsuarioDetalleModal usuarioId="usuario-1" onClose={vi.fn()} onDesactivar={onDesactivar} />);
    await user.click(screen.getByRole('button', { name: 'Desactivar' }));

    expect(onDesactivar).toHaveBeenCalledWith({ id: 'usuario-1', nombre: 'Juan García' });
  });
});
