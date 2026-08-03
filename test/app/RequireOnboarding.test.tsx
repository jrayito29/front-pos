import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { RequireOnboarding } from '../../src/app/RequireOnboarding';
import { useSessionStore } from '../../src/stores/session.store';
import { ROUTES } from '../../src/constants/routes';

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.COMPLETAR_PERFIL]}>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<p>pantalla de login</p>} />
        <Route element={<RequireOnboarding />}>
          <Route path={ROUTES.COMPLETAR_PERFIL} element={<p>wizard de completar perfil</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  useSessionStore.getState().clearSession();
  vi.restoreAllMocks();
});

describe('RequireOnboarding', () => {
  // spec:SPEC-004:REQ-U1
  it('redirige a /login cuando no hay onboardingToken (una vez rehidratado el store)', () => {
    vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(true);

    renderGuard();

    expect(screen.getByText('pantalla de login')).toBeInTheDocument();
    expect(screen.queryByText('wizard de completar perfil')).not.toBeInTheDocument();
  });

  // Regresión: navigate() de react-router es diferido (startTransition); tras completar el perfil
  // (REQ-E4), setTenantSession limpia onboardingToken de forma síncrona ANTES de que la navegación a
  // dashboard aterrice, y este guard sigue montado en /completar-perfil un instante. Sin este
  // chequeo de accessToken, ese instante dispara un redirect a /login que le gana la carrera a la
  // navegación al dashboard (ver test/app/CompletarPerfilFlow.test.tsx para el repro end-to-end).
  it('no redirige a /login si onboardingToken es null pero ya hay accessToken (sesión promovida a tenant)', () => {
    vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(true);
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-1', empresaId: 'empresa-1' });

    renderGuard();

    expect(screen.getByText('wizard de completar perfil')).toBeInTheDocument();
    expect(screen.queryByText('pantalla de login')).not.toBeInTheDocument();
  });

  it('renderiza el wizard cuando sí hay onboardingToken', () => {
    vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(true);
    useSessionStore.getState().setOnboardingSession({
      onboardingToken: 'onboarding-1',
      refreshToken: 'refresh-1',
      usuarioId: 'usuario-1',
    });

    renderGuard();

    expect(screen.getByText('wizard de completar perfil')).toBeInTheDocument();
  });

  // spec:SPEC-004:REQ-S5
  it('no redirige a /login mientras persist todavía no ha rehidratado, aunque el token esté vacío', () => {
    vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(false);
    vi.spyOn(useSessionStore.persist, 'onFinishHydration').mockImplementation(() => () => {});

    renderGuard();

    expect(screen.queryByText('pantalla de login')).not.toBeInTheDocument();
    expect(screen.queryByText('wizard de completar perfil')).not.toBeInTheDocument();
  });

  // spec:SPEC-004:REQ-S5
  it('evalúa el guard en cuanto termina la rehidratación, sin quedarse bloqueado indefinidamente', async () => {
    let finishHydration: Parameters<typeof useSessionStore.persist.onFinishHydration>[0] = () => {};
    vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(false);
    vi.spyOn(useSessionStore.persist, 'onFinishHydration').mockImplementation((cb) => {
      finishHydration = cb;
      return () => {};
    });
    useSessionStore.getState().setOnboardingSession({
      onboardingToken: 'onboarding-1',
      refreshToken: 'refresh-1',
      usuarioId: 'usuario-1',
    });

    renderGuard();
    expect(screen.queryByText('wizard de completar perfil')).not.toBeInTheDocument();

    finishHydration(useSessionStore.getState());

    expect(await screen.findByText('wizard de completar perfil')).toBeInTheDocument();
  });
});
