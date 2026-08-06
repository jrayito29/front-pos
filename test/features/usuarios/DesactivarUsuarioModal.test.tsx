import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DesactivarUsuarioModal } from '../../../src/features/usuarios/components/DesactivarUsuarioModal';
import * as useDesactivarUsuarioModule from '../../../src/features/usuarios/hooks/useDesactivarUsuario';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mutateMock = vi.fn();

function mockHook() {
  vi.spyOn(useDesactivarUsuarioModule, 'useDesactivarUsuario').mockReturnValue({
    mutate: mutateMock,
    isPending: false,
  } as unknown as ReturnType<typeof useDesactivarUsuarioModule.useDesactivarUsuario>);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('DesactivarUsuarioModal', () => {
  // spec:SPEC-011:REQ-E4 — el copy explica la consecuencia (revocación de sesiones/bloqueo inmediato)
  it('muestra el nombre del usuario y explica que se revocan sus sesiones activas', () => {
    mockHook();
    render(<DesactivarUsuarioModal usuario={{ id: 'usuario-1', nombre: 'Juan García' }} onClose={vi.fn()} onDesactivado={vi.fn()} />);

    expect(screen.getByText('Juan García')).toBeInTheDocument();
    expect(screen.getByText(/se revocarán todas sus/i)).toBeInTheDocument();
  });

  // spec:SPEC-011:REQ-E4
  it('confirmar llama a la mutación con el id correcto y, al tener éxito, cierra y notifica', async () => {
    mockHook();
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onDesactivado = vi.fn();
    mutateMock.mockImplementation((_id, options) => {
      options.onSuccess();
    });

    render(<DesactivarUsuarioModal usuario={{ id: 'usuario-1', nombre: 'Juan García' }} onClose={onClose} onDesactivado={onDesactivado} />);
    await user.click(screen.getByRole('button', { name: 'Desactivar' }));

    expect(mutateMock).toHaveBeenCalledWith('usuario-1', expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }));
    expect(onClose).toHaveBeenCalled();
    expect(onDesactivado).toHaveBeenCalled();
  });

  // spec:SPEC-011:REQ-X7 — cerrar sin confirmar no ejecuta la mutación
  it('cancelar no ejecuta la mutación', async () => {
    mockHook();
    const user = userEvent.setup();
    render(<DesactivarUsuarioModal usuario={{ id: 'usuario-1', nombre: 'Juan García' }} onClose={vi.fn()} onDesactivado={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(mutateMock).not.toHaveBeenCalled();
  });

  // spec:SPEC-011:REQ-X6 — falla como red de seguridad (ej. autodesactivación por carrera), vía toast
  it('si la mutación falla, no cierra la modal (el error se comunica vía toast)', async () => {
    mockHook();
    const user = userEvent.setup();
    const onClose = vi.fn();
    mutateMock.mockImplementation((_id, options) => {
      options.onError({ code: 'ERR_USER_SELF_DEACTIVATION', message: 'No puedes desactivarte a ti mismo' });
    });

    render(<DesactivarUsuarioModal usuario={{ id: 'usuario-1', nombre: 'Juan García' }} onClose={onClose} onDesactivado={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Desactivar' }));

    expect(onClose).not.toHaveBeenCalled();
  });
});
