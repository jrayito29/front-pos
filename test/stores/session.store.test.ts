import { afterEach, describe, expect, it } from 'vitest';
import { useSessionStore } from '../../src/stores/session.store';

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
  // spec:SPEC-007:REQ-U8 — usuarioId/empresaId de la rama tenant nunca se persisten, aunque sí
  // existan en memoria (mismo privilegio que accessToken).
  it('la sesión de tenant persiste refreshToken en sessionStorage, pero accessToken/usuarioId/empresaId siguen in-memory', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-abc', refreshToken: 'refresh-tenant', usuarioId: 'usuario-1', empresaId: 'empresa-1' });
    await flushPersist();

    const raw = sessionStorage.getItem('onboarding-session');
    const persisted = raw ? JSON.parse(raw).state : {};

    expect(useSessionStore.getState().accessToken).toBe('access-abc');
    expect(useSessionStore.getState().usuarioId).toBe('usuario-1');
    expect(useSessionStore.getState().empresaId).toBe('empresa-1');
    expect(persisted.refreshToken).toBe('refresh-tenant');
    expect(persisted.onboardingToken).toBeNull();
    expect(persisted.usuarioId).toBeNull();
    expect(persisted.empresaId).toBeUndefined();
  });
});

describe('session.store — REQ-U3 (SPEC-005)', () => {
  // spec:SPEC-005:REQ-U3
  it('setAccessToken actualiza únicamente accessToken, sin resetear el resto del estado de sesión', () => {
    useSessionStore.getState().setTenantSession({
      accessToken: 'access-old',
      refreshToken: 'refresh-1',
      usuarioId: 'usuario-1',
      empresaId: 'empresa-1',
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

describe('session.store — REQ-U8 (SPEC-007)', () => {
  // spec:SPEC-007:REQ-U8
  it('setSysAdminSession no acepta ni asume usuarioId/empresaId — quedan null', () => {
    useSessionStore.getState().setSysAdminSession({ accessToken: 'access-sysadmin', refreshToken: 'refresh-1' });

    const state = useSessionStore.getState();
    expect(state.accessToken).toBe('access-sysadmin');
    expect(state.usuarioId).toBeNull();
    expect(state.empresaId).toBeNull();
  });

  // spec:SPEC-007:REQ-U8
  it('setOnboardingSession limpia empresaId de una sesión tenant previa', () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-1', empresaId: 'empresa-1' });

    useSessionStore.getState().setOnboardingSession({ onboardingToken: 'onboarding-1', refreshToken: 'refresh-2', usuarioId: 'usuario-2' });

    expect(useSessionStore.getState().empresaId).toBeNull();
  });
});
