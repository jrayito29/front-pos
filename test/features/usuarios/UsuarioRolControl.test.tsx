import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsuarioRolControl } from '../../../src/features/usuarios/components/UsuarioRolControl';
import * as useCambiarRolUsuarioModule from '../../../src/features/usuarios/hooks/useCambiarRolUsuario';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mutateMock = vi.fn();

function mockHook() {
  vi.spyOn(useCambiarRolUsuarioModule, 'useCambiarRolUsuario').mockReturnValue({
    mutate: mutateMock,
    isPending: false,
  } as unknown as ReturnType<typeof useCambiarRolUsuarioModule.useCambiarRolUsuario>);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('UsuarioRolControl', () => {
  // spec:SPEC-011:REQ-U6 — Select con las 7 opciones, no un Switch binario
  it('muestra un Select (no un switch) con el rol actual seleccionado', () => {
    mockHook();
    render(<UsuarioRolControl usuarioId="usuario-1" role="cajero" />);

    expect(screen.getByText('Cajero')).toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  // rol no asignable (ej. el propio superadmin en su fila) — badge de solo lectura
  it('si el rol actual no pertenece a ROLES_ASIGNABLES (ej. superadmin), muestra un badge de solo lectura', () => {
    mockHook();
    render(<UsuarioRolControl usuarioId="usuario-9" role="superadmin" />);

    expect(screen.getByText('superadmin')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  // spec:SPEC-011:REQ-E3 — el cambio aplica al instante, sin modal de confirmación
  it('cambiar el rol llama a la mutación con el nuevo valor, sin modal de confirmación', async () => {
    mockHook();
    const user = userEvent.setup();
    render(<UsuarioRolControl usuarioId="usuario-1" role="cajero" />);

    await user.click(screen.getByText('Cajero'));
    await user.click(screen.getByText('Gerente'));

    expect(mutateMock).toHaveBeenCalledWith(
      { id: 'usuario-1', role: 'gerente' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // spec:SPEC-011:REQ-X5 — ERR_ROLE_INVALID se ancla al propio control
  it('ERR_ROLE_INVALID ancla el mensaje de error al control en vez de mostrar solo un toast', async () => {
    mockHook();
    const user = userEvent.setup();
    mutateMock.mockImplementation((_vars, options) => {
      options.onError({ code: 'ERR_ROLE_INVALID', message: 'Rol no permitido para este flujo.' });
    });

    render(<UsuarioRolControl usuarioId="usuario-1" role="cajero" />);
    await user.click(screen.getByText('Cajero'));
    await user.click(screen.getByText('Gerente'));

    expect(await screen.findByText('Rol no permitido para este flujo.')).toBeInTheDocument();
  });
});
