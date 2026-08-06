import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsuarioFormModal } from '../../../src/features/usuarios/components/UsuarioFormModal';
import * as useCrearUsuarioModule from '../../../src/features/usuarios/hooks/useCrearUsuario';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const crearMutateMock = vi.fn();

function mockHooks() {
  vi.spyOn(useCrearUsuarioModule, 'useCrearUsuario').mockReturnValue({
    mutate: crearMutateMock,
    isPending: false,
  } as unknown as ReturnType<typeof useCrearUsuarioModule.useCrearUsuario>);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('UsuarioFormModal', () => {
  // spec:SPEC-011:REQ-U5 — solo crea, sin modo edición
  it('título "Nuevo usuario" y los campos inician vacíos', () => {
    mockHooks();
    render(<UsuarioFormModal isOpen onClose={vi.fn()} onCreated={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Nuevo usuario' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email', { exact: false })).toHaveValue('');
    expect(screen.getByLabelText('Nombre', { exact: false })).toHaveValue('');
  });

  // spec:SPEC-011:REQ-E2 — al crear con éxito, invoca onCreated (UsuarioCreadoModal es la confirmación)
  it('crear: envía email/role/nombre/apellidoPaterno y llama a onCreated + onClose al tener éxito', async () => {
    mockHooks();
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCreated = vi.fn();
    const creado = {
      usuarioId: 'usuario-nuevo',
      email: 'nuevo@empresa.com',
      role: 'cajero',
      nombre: 'Ana',
      apellidoPaterno: 'López',
      contraseñaTemporal: 'Ax3$mP9kLq2!',
      passwordTempExpires: '2026-05-24T12:00:00.000Z',
    };
    crearMutateMock.mockImplementation((_payload, options) => {
      options.onSuccess(creado);
    });

    render(<UsuarioFormModal isOpen onClose={onClose} onCreated={onCreated} />);
    await user.type(screen.getByLabelText('Email', { exact: false }), 'nuevo@empresa.com');
    await user.click(screen.getByLabelText('Rol', { exact: false }));
    await user.click(screen.getByText('Cajero'));
    await user.type(screen.getByLabelText('Nombre', { exact: false }), 'Ana');
    await user.type(screen.getByLabelText('Apellido paterno', { exact: false }), 'López');
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    expect(crearMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'nuevo@empresa.com', role: 'cajero', nombre: 'Ana', apellidoPaterno: 'López' }),
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
    expect(onCreated).toHaveBeenCalledWith(creado);
    expect(onClose).toHaveBeenCalled();
  });

  // spec:SPEC-011:REQ-X4
  it('email duplicado: ancla el error al campo Email en vez de mostrar solo un toast', async () => {
    mockHooks();
    const user = userEvent.setup();
    crearMutateMock.mockImplementation((_payload, options) => {
      options.onError({ code: 'ERR_EMAIL_ALREADY_EXISTS', message: 'Ese email ya está registrado' });
    });

    render(<UsuarioFormModal isOpen onClose={vi.fn()} onCreated={vi.fn()} />);
    await user.type(screen.getByLabelText('Email', { exact: false }), 'existente@empresa.com');
    await user.click(screen.getByLabelText('Rol', { exact: false }));
    await user.click(screen.getByText('Cajero'));
    await user.type(screen.getByLabelText('Nombre', { exact: false }), 'Ana');
    await user.type(screen.getByLabelText('Apellido paterno', { exact: false }), 'López');
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    expect(await screen.findByText('Ese email ya está registrado')).toBeInTheDocument();
  });
});
