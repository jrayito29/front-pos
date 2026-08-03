import { afterEach, describe, expect, it } from 'vitest';
import { useSessionStore } from './session.store';

function flushPersist() {
  // El middleware `persist` escribe a sessionStorage en un microtask tras cada `set` (ver
  // createJSONStorage). Un `await` de una promesa ya resuelta es suficiente para dejarlo pasar.
  return new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  useSessionStore.getState().clearSession();
  sessionStorage.clear();
});

describe('session.store — REQ-U11 (SPEC-004) / REQ-U1 (adenda SPEC-005)', () => {
  // spec:SPEC-004:REQ-U11 / spec:SPEC-005:REQ-U1
  it('persiste onboardingToken/usuarioId/refreshToken en sessionStorage, nunca accessToken', async () => {
    useSessionStore.getState().setOnboardingSession({
      onboardingToken: 'onboarding-abc',
      refreshToken: 'refresh-abc',
      usuarioId: 'usuario-1',
    });
    await flushPersist();

    const raw = sessionStorage.getItem('onboarding-session');
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw!).state;

    expect(persisted).toEqual({ onboardingToken: 'onboarding-abc', usuarioId: 'usuario-1', refreshToken: 'refresh-abc' });
    expect(persisted.accessToken).toBeUndefined();
  });

  // spec:SPEC-005:REQ-U1 — refreshToken es un único campo compartido entre la rama onboarding y la
  // rama tenant; persistirlo cubre ambos casos de reload con un solo campo en partialize.
  it('la sesión de tenant persiste refreshToken en sessionStorage, pero accessToken sigue in-memory', async () => {
    useSessionStore.getState().setTenantSession({ accessToken: 'access-abc', refreshToken: 'refresh-tenant' });
    await flushPersist();

    const raw = sessionStorage.getItem('onboarding-session');
    const persisted = raw ? JSON.parse(raw).state : {};

    expect(useSessionStore.getState().accessToken).toBe('access-abc');
    expect(persisted.refreshToken).toBe('refresh-tenant');
    expect(persisted.onboardingToken).toBeNull();
    expect(persisted.usuarioId).toBeNull();
  });
});

describe('session.store — REQ-U3 (SPEC-005)', () => {
  // spec:SPEC-005:REQ-U3
  it('setAccessToken actualiza únicamente accessToken, sin resetear el resto del estado de sesión', () => {
    useSessionStore.getState().setTenantSession({
      accessToken: 'access-old',
      refreshToken: 'refresh-1',
      mustChangePassword: true,
      requiereSeleccionSucursal: true,
    });

    useSessionStore.getState().setAccessToken('access-new');

    const state = useSessionStore.getState();
    expect(state.accessToken).toBe('access-new');
    expect(state.refreshToken).toBe('refresh-1');
    expect(state.mustChangePassword).toBe(true);
    expect(state.requiereSeleccionSucursal).toBe(true);
  });
});
