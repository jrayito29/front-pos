import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  onboardingToken: string | null;
  // SPEC-004 REQ-U11 — requerido para armar el header `x-usuario-id` (ver services/apiClient.ts).
  usuarioId: string | null;
  // Banderas de LoginTenantResponse que bloquean el dashboard con un modal hasta resolverse.
  mustChangePassword: boolean;
  requiereSeleccionSucursal: boolean;
}

interface SessionActions {
  setTenantSession: (payload: {
    accessToken: string;
    refreshToken: string;
    mustChangePassword?: boolean;
    requiereSeleccionSucursal?: boolean;
  }) => void;
  setOnboardingSession: (tokens: { onboardingToken: string; refreshToken: string; usuarioId: string }) => void;
  // SPEC-005 REQ-U3 — actualiza únicamente accessToken (resultado de un refresh silencioso o de un
  // reintento de interceptor). A diferencia de setTenantSession, NO resetea onboardingToken/usuarioId
  // ni las banderas mustChangePassword/requiereSeleccionSucursal — RefreshTenantResponse no las trae.
  setAccessToken: (accessToken: string) => void;
  resolveMustChangePassword: () => void;
  resolveRequiereSeleccionSucursal: () => void;
  clearSession: () => void;
}

type SessionStore = SessionState & SessionActions;

const initialState: SessionState = {
  accessToken: null,
  refreshToken: null,
  onboardingToken: null,
  usuarioId: null,
  mustChangePassword: false,
  requiereSeleccionSucursal: false,
};

// Zustand = solo estado de cliente (sesión). Nunca duplicar datos de servidor aquí. Ref: CLAUDE.md §3
// SPEC-004 REQ-U11 (adenda) + SPEC-005 REQ-U1 (adenda) — `partialize` persiste
// { onboardingToken, usuarioId, refreshToken } en sessionStorage. `refreshToken` es un único campo
// compartido entre la rama onboarding y la rama tenant (setOnboardingSession/setTenantSession
// escriben el mismo slice), así que incluirlo cubre el reload tanto a mitad del wizard de completar
// perfil (RequireOnboarding) como con sesión de tenant activa (RequireAuth, ver SPEC-005 REQ-U5).
// `accessToken` NUNCA se persiste — es de mayor privilegio, permanece exclusivamente in-memory; tras
// un reload se recupera con un refresh silencioso contra POST /auth/refresh usando el refreshToken
// persistido (SPEC-005 REQ-U5), no con acceso directo a sessionStorage.
export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      ...initialState,
      setTenantSession: ({ accessToken, refreshToken, mustChangePassword = false, requiereSeleccionSucursal = false }) =>
        set({
          accessToken,
          refreshToken,
          onboardingToken: null,
          usuarioId: null,
          mustChangePassword,
          requiereSeleccionSucursal,
        }),
      setOnboardingSession: ({ onboardingToken, refreshToken, usuarioId }) =>
        set({
          onboardingToken,
          refreshToken,
          usuarioId,
          accessToken: null,
          mustChangePassword: false,
          requiereSeleccionSucursal: false,
        }),
      setAccessToken: (accessToken) => set({ accessToken }),
      resolveMustChangePassword: () => set({ mustChangePassword: false }),
      resolveRequiereSeleccionSucursal: () => set({ requiereSeleccionSucursal: false }),
      clearSession: () => set(initialState),
    }),
    {
      name: 'onboarding-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        onboardingToken: state.onboardingToken,
        usuarioId: state.usuarioId,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
