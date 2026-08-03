import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { AppRouter } from '../../src/app/router';
import { useSessionStore } from '../../src/stores/session.store';
import { ROUTES } from '../../src/constants/routes';
import * as authService from '../../src/features/auth/services/auth.service';

// Regresión: reporte de usuario de que al completar el perfil la app termina en /login en vez de
// /dashboard. A diferencia de useCompletarPerfil.test.tsx (que mockea useNavigate de forma
// aislada), este test monta el árbol de rutas REAL — RequireOnboarding + RequireAuth incluidos —
// para detectar la carrera entre limpiar `onboardingToken` (setTenantSession, síncrono) y la
// navegación de react-router (startTransition, diferida). Ver RequireOnboarding.tsx para el fix.
function renderApp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={[ROUTES.COMPLETAR_PERFIL]}>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  useSessionStore.getState().clearSession();
  vi.restoreAllMocks();
});

describe('Flujo completo de completar-perfil (regresión: no debe caer en /login)', () => {
  it('tras completar los 3 pasos con éxito, termina en el dashboard y no en /login', async () => {
    vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(true);
    useSessionStore.getState().setOnboardingSession({
      onboardingToken: 'onboarding-1',
      refreshToken: 'refresh-1',
      usuarioId: 'usuario-1',
    });
    vi.spyOn(authService, 'completarPerfil').mockResolvedValue({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      empresaId: 'empresa-1',
      perfilCompleto: true,
    });

    const user = userEvent.setup();
    renderApp();

    await user.type(await screen.findByLabelText('Nombre'), 'Ana');
    await user.type(screen.getByLabelText('Apellido paterno'), 'García');
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    await user.click(await screen.findByRole('button', { name: 'Omitir por ahora' }));

    await user.type(await screen.findByLabelText('Nombre de la empresa'), 'Deccode SA de CV');
    await user.click(screen.getByRole('button', { name: 'Completar registro' }));

    await waitFor(() => expect(authService.completarPerfil).toHaveBeenCalled());

    expect(await screen.findByText('Dashboard', { selector: 'span' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/correo|contraseña/i)).not.toBeInTheDocument();
    expect(useSessionStore.getState().accessToken).toBe('access-1');
  });
});
