import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsuarioCreadoModal } from '../../../src/features/usuarios/components/UsuarioCreadoModal';
import type { UsuarioCreadoDTO } from '../../../src/features/usuarios/types/usuario.types';

function usuarioCreadoFixture(): UsuarioCreadoDTO {
  return {
    usuarioId: 'usuario-1',
    email: 'juan@empresa.com',
    role: 'cajero',
    nombre: 'Juan',
    apellidoPaterno: 'García',
    contraseñaTemporal: 'Ax3$mP9kLq2!',
    passwordTempExpires: '2026-05-24T12:00:00.000Z',
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('UsuarioCreadoModal', () => {
  // spec:SPEC-011:REQ-U7
  it('muestra el email, el rol y la contraseña temporal en texto plano, con la advertencia de "una sola vez"', () => {
    render(<UsuarioCreadoModal usuario={usuarioCreadoFixture()} onClose={vi.fn()} />);

    expect(screen.getByText('juan@empresa.com')).toBeInTheDocument();
    expect(screen.getByText('Cajero')).toBeInTheDocument();
    expect(screen.getByText('Ax3$mP9kLq2!')).toBeInTheDocument();
    expect(screen.getByText(/no volverá a mostrarse/)).toBeInTheDocument();
  });

  // spec:SPEC-011:REQ-S3 — no se cierra con click fuera/Escape, solo con el botón explícito
  it('Escape no cierra la modal (dismissible=false)', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<UsuarioCreadoModal usuario={usuarioCreadoFixture()} onClose={onClose} />);

    await user.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Ax3$mP9kLq2!')).toBeInTheDocument();
  });

  // spec:SPEC-011:REQ-S3 — solo el botón "Entendido, cerrar" invoca onClose
  it('el botón "Entendido, cerrar" invoca onClose', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<UsuarioCreadoModal usuario={usuarioCreadoFixture()} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Entendido, cerrar' }));

    expect(onClose).toHaveBeenCalled();
  });

  // spec:SPEC-011:REQ-U7 — copia la contraseña temporal al portapapeles
  it('el botón "Copiar" copia la contraseña temporal y refleja el feedback "Copiado"', async () => {
    // `userEvent.setup()` instala su propio stub de `navigator.clipboard` (clipboard real de jsdom,
    // con `writeText` funcional) — debe llamarse ANTES de redefinir la propiedad, o la sobreescribe.
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<UsuarioCreadoModal usuario={usuarioCreadoFixture()} onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Copiar' }));

    expect(writeText).toHaveBeenCalledWith('Ax3$mP9kLq2!');
    expect(await screen.findByRole('button', { name: 'Copiado' })).toBeInTheDocument();
  });
});
