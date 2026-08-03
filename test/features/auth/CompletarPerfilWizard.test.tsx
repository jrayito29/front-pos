import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompletarPerfilWizard } from '../../../src/features/auth/components/CompletarPerfilWizard';
import * as useCompletarPerfilModule from '../../../src/features/auth/hooks/useCompletarPerfil';

const mutateMock = vi.fn();

type CompletarPerfilMutation = ReturnType<typeof useCompletarPerfilModule.useCompletarPerfil>;

function mockHook(overrides: Partial<CompletarPerfilMutation> = {}) {
  vi.spyOn(useCompletarPerfilModule, 'useCompletarPerfil').mockReturnValue({
    mutate: mutateMock,
    isPending: false,
    ...overrides,
  } as CompletarPerfilMutation);
}

async function avanzarADomicilio(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre'), 'Ana');
  await user.type(screen.getByLabelText('Apellido paterno'), 'García');
  await user.click(screen.getByRole('button', { name: 'Siguiente' }));
}

async function avanzarAEmpresa(user: ReturnType<typeof userEvent.setup>) {
  await avanzarADomicilio(user);
  await user.click(await screen.findByRole('button', { name: 'Omitir por ahora' }));
  await screen.findByLabelText('Nombre de la empresa');
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('CompletarPerfilWizard', () => {
  // spec:SPEC-004:REQ-U2
  it('renderiza el Logo tamaño sm como única referencia de marca, sin BrandPanel', () => {
    mockHook();
    render(<CompletarPerfilWizard />);
    expect(screen.getByRole('img', { name: 'Deccode' })).toBeInTheDocument();
  });

  // spec:SPEC-004:REQ-U3
  // spec:SPEC-004:REQ-S1
  it('muestra el indicador de progreso con el paso activo resaltado', () => {
    mockHook();
    render(<CompletarPerfilWizard />);
    expect(screen.getByLabelText('Paso 1 de 3')).toBeInTheDocument();
    expect(screen.getByText('Datos personales')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Empresa')).not.toHaveAttribute('aria-current');
  });

  // spec:SPEC-004:REQ-U4
  // spec:SPEC-004:REQ-U7
  it('el paso "Datos personales" tiene los 4 campos con label visible (no solo placeholder)', () => {
    mockHook();
    render(<CompletarPerfilWizard />);
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Apellido paterno')).toBeInTheDocument();
    expect(screen.getByLabelText('Apellido materno (opcional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Teléfono (opcional)')).toBeInTheDocument();
  });

  // spec:SPEC-004:REQ-X4
  it('bloquea el avance si nombre/apellidoPaterno están vacíos, marca aria-invalid y no llama a la mutación', async () => {
    mockHook();
    const user = userEvent.setup();
    render(<CompletarPerfilWizard />);

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('El nombre es requerido')).toBeInTheDocument();
    expect(screen.getByText('El apellido paterno es requerido')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Datos personales')).toHaveAttribute('aria-current', 'step');
    expect(mutateMock).not.toHaveBeenCalled();
  });

  // spec:SPEC-004:REQ-E1
  // spec:SPEC-004:REQ-U9
  // spec:SPEC-004:REQ-E2
  it('avanza a Domicilio con datos válidos y conserva los valores del paso anterior al retroceder', async () => {
    mockHook();
    const user = userEvent.setup();
    render(<CompletarPerfilWizard />);

    await avanzarADomicilio(user);
    expect(await screen.findByLabelText('Calle (opcional)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Atrás' }));

    expect(await screen.findByLabelText('Nombre')).toHaveValue('Ana');
    expect(screen.getByLabelText('Apellido paterno')).toHaveValue('García');
  });

  // spec:SPEC-004:REQ-U5
  it('el paso Domicilio muestra "Omitir por ahora" y avanza sin validar (campos 100% opcionales)', async () => {
    mockHook();
    const user = userEvent.setup();
    render(<CompletarPerfilWizard />);

    await avanzarADomicilio(user);
    expect(await screen.findByRole('button', { name: 'Omitir por ahora' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Omitir por ahora' }));
    expect(await screen.findByLabelText('Nombre de la empresa')).toBeInTheDocument();
  });

  // spec:SPEC-004:REQ-U6
  it('el paso Empresa pide nombre requerido y rfc opcional, con botón final "Completar registro"', async () => {
    mockHook();
    const user = userEvent.setup();
    render(<CompletarPerfilWizard />);

    await avanzarAEmpresa(user);

    expect(screen.getByLabelText('Nombre de la empresa')).toBeInTheDocument();
    expect(screen.getByLabelText('RFC (opcional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Completar registro' })).toBeInTheDocument();
  });

  // spec:SPEC-004:REQ-E3
  it('al enviar el paso Empresa con datos válidos, dispara la mutación con el body acumulado de los 3 pasos', async () => {
    mockHook();
    const user = userEvent.setup();
    render(<CompletarPerfilWizard />);

    await avanzarAEmpresa(user);
    await user.type(screen.getByLabelText('Nombre de la empresa'), 'Deccode SA de CV');
    await user.click(screen.getByRole('button', { name: 'Completar registro' }));

    await waitFor(() => expect(mutateMock).toHaveBeenCalled());
    expect(mutateMock.mock.calls[0][0]).toMatchObject({
      nombre: 'Ana',
      apellidoPaterno: 'García',
      empresa: { nombre: 'Deccode SA de CV' },
    });
  });

  // spec:SPEC-004:REQ-X4
  it('bloquea el envío final si empresa.nombre está vacío', async () => {
    mockHook();
    const user = userEvent.setup();
    render(<CompletarPerfilWizard />);

    await avanzarAEmpresa(user);
    await user.click(screen.getByRole('button', { name: 'Completar registro' }));

    expect(await screen.findByText('El nombre de la empresa es requerido')).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  // spec:SPEC-004:REQ-S3
  // spec:SPEC-004:REQ-S4
  it('mientras la mutación está en curso, deshabilita campos de Empresa, navegación, y cambia el label del botón', async () => {
    mockHook({ isPending: false });
    const user = userEvent.setup();
    const { rerender } = render(<CompletarPerfilWizard />);

    await avanzarAEmpresa(user);

    mockHook({ isPending: true });
    rerender(<CompletarPerfilWizard />);

    expect(screen.getByLabelText('Nombre de la empresa')).toBeDisabled();
    expect(screen.getByLabelText('RFC (opcional)')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Atrás' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Creando tu empresa...' })).toBeInTheDocument();
  });

  // spec:SPEC-004:REQ-S2
  it('reutiliza el contrato de crossfade (220ms entrada/140ms salida, blur, easing custom)', () => {
    mockHook();
    const { container } = render(<CompletarPerfilWizard />);
    expect(container.innerHTML).toContain('duration-[220ms]');
    expect(container.innerHTML).toContain('ease-out-strong');
    expect(container.innerHTML).toContain('blur-sm');
  });

  // spec:SPEC-004:REQ-U8
  it('bloquea letras y signos en tiempo real al escribir en teléfono y código postal', async () => {
    mockHook();
    const user = userEvent.setup();
    render(<CompletarPerfilWizard />);

    const telefonoInput = screen.getByLabelText('Teléfono (opcional)');
    await user.type(telefonoInput, '55-abc!12345');
    expect(telefonoInput).toHaveValue('55-12345');
    await user.clear(telefonoInput);

    await avanzarADomicilio(user);
    const cpInput = await screen.findByLabelText('Código postal (opcional)');
    await user.type(cpInput, '1a2b3c4d5e6f');
    expect(cpInput).toHaveValue('12345');
  });

  // spec:SPEC-004:REQ-U12
  it('contiene el wizard en 100dvh sin scroll de página, con scroll interno solo en el área de campos', () => {
    mockHook();
    const { container } = render(<CompletarPerfilWizard />);

    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain('h-dvh');
    expect(outer.className).toContain('overflow-hidden');
    expect(outer.className).not.toContain('min-h-dvh');

    const scrollArea = container.querySelector('.overflow-y-auto');
    expect(scrollArea).not.toBeNull();
  });

  // spec:SPEC-004:REQ-E5
  it('mueve el foco al primer campo del paso entrante tras completar la transición', async () => {
    mockHook();
    const user = userEvent.setup();
    render(<CompletarPerfilWizard />);

    await avanzarADomicilio(user);

    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Calle (opcional)')), {
      timeout: 1000,
    });
  });
});
