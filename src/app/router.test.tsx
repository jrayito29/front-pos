import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './router';
import { useSessionStore } from '../stores/session.store';
import { ROUTES } from '../constants/routes';

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={[path]}>
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

describe('AppRouter — code splitting (SPEC-006)', () => {
  // spec:SPEC-006:REQ-U1 / REQ-U3
  it('/login resuelve al componente real vía lazy(), sin romper el barrel síncrono de la feature', async () => {
    renderAt(ROUTES.LOGIN);

    expect(await screen.findByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  // spec:SPEC-006:REQ-U1
  it('/completar-perfil resuelve al wizard real vía lazy(), en un chunk independiente del de login', async () => {
    vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(true);
    useSessionStore.getState().setOnboardingSession({
      onboardingToken: 'onboarding-1',
      refreshToken: 'refresh-1',
      usuarioId: 'usuario-1',
    });

    renderAt(ROUTES.COMPLETAR_PERFIL);

    expect(await screen.findByLabelText('Nombre')).toBeInTheDocument();
  });

  // spec:SPEC-006:REQ-E1
  it('revisitar una ruta cuyo chunk ya se descargó no vuelve a mostrar el fallback de carga', async () => {
    // "Calienta" el chunk de /login con un primer render — React.lazy cachea la promesa del
    // import() a nivel de módulo, igual que el navegador cachea el chunk ya descargado.
    const { unmount } = renderAt(ROUTES.LOGIN);
    await screen.findByRole('button', { name: 'Iniciar sesión' });
    unmount();

    renderAt(ROUTES.LOGIN);

    // Si tuviera que re-suspender, lo único disponible de forma síncrona sería el fallback
    // (role="status"); al estar ya cacheado el import(), el botón real aparece directo.
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Cargando' })).not.toBeInTheDocument();
  });
});
