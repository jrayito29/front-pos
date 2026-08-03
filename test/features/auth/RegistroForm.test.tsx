import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { RegistroForm } from '../../../src/features/auth/components/RegistroForm';
import * as usePreRegistroModule from '../../../src/features/auth/hooks/usePreRegistro';

const mutateMock = vi.fn();

function mockHook() {
  vi.spyOn(usePreRegistroModule, 'usePreRegistro').mockReturnValue({
    mutate: mutateMock,
    isPending: false,
    error: null,
  } as unknown as ReturnType<typeof usePreRegistroModule.usePreRegistro>);
}

function renderForm() {
  return render(
    <MemoryRouter>
      <RegistroForm />
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('RegistroForm — validación de email', () => {
  it('bloquea el envío y muestra "Email inválido" si el correo no tiene formato válido', async () => {
    mockHook();
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Correo electrónico'), 'esto-no-es-un-email');
    await user.type(screen.getByLabelText('Contraseña'), 'Password1');
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(await screen.findByText('Email inválido')).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('permite el envío con un correo válido', async () => {
    mockHook();
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@deccode.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Password1');
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(screen.queryByText('Email inválido')).not.toBeInTheDocument();
    expect(mutateMock).toHaveBeenCalledWith({ email: 'ana@deccode.com', password: 'Password1' });
  });
});
