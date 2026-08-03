import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { CompletarPerfilWizard } from '../../../src/features/auth/components/CompletarPerfilWizard';
import * as authService from '../../../src/features/auth/services/auth.service';

// Regresión: reporte de usuario de que, tras completar el perfil, la app aterriza brevemente en el
// dashboard y ~1s después vuelve a /login. Causa: "Completar registro" solo queda `disabled` hasta
// el siguiente render con isPending=true — un doble click/submit antes de ese render puede llamar
// mutate() dos veces. La segunda petición llega después de que la primera ya creó la empresa, el
// backend responde ERR_EMPRESA_ALREADY_EXISTS (REQ-X1) y ese handler limpia la sesión y redirige a
// /login. A diferencia de mockear useCompletarPerfil (isPending quedaría fijo), este test usa el
// hook real sobre un mock de servicio con promesa controlada, para que isPending sea reactivo de
// verdad — igual que en el navegador.
function renderWizard() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <CompletarPerfilWizard />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('CompletarPerfilWizard — guard de doble envío', () => {
  it('un segundo click en "Completar registro" mientras la mutación está en curso no dispara una segunda petición', async () => {
    let resolveRequest: (() => void) | undefined;
    const completarPerfilSpy = vi.spyOn(authService, 'completarPerfil').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = () =>
            resolve({ accessToken: 'access-1', refreshToken: 'refresh-1', empresaId: 'empresa-1', perfilCompleto: true });
        })
    );

    const user = userEvent.setup();
    renderWizard();

    await user.type(screen.getByLabelText('Nombre'), 'Ana');
    await user.type(screen.getByLabelText('Apellido paterno'), 'García');
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    await user.click(await screen.findByRole('button', { name: 'Omitir por ahora' }));

    await user.type(await screen.findByLabelText('Nombre de la empresa'), 'Deccode SA de CV');

    const submitButton = screen.getByRole('button', { name: 'Completar registro' });
    fireEvent.click(submitButton);

    // La petición sigue pendiente (no hemos resuelto la promesa) — un segundo intento de submit en
    // esta ventana es exactamente la carrera reportada.
    await waitFor(() => expect(completarPerfilSpy).toHaveBeenCalledTimes(1));
    fireEvent.submit(submitButton.closest('form')!);

    resolveRequest?.();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Creando tu empresa...' })).not.toBeInTheDocument());

    expect(completarPerfilSpy).toHaveBeenCalledTimes(1);
  });
});
