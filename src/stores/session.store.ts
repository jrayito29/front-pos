import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  onboardingToken: string | null;
  // SPEC-004 REQ-U11 — requerido para armar el header `x-usuario-id` (ver services/apiClient.ts).
  // En la rama tenant (SPEC-007 REQ-U8) viaja junto a `empresaId`, mismo tratamiento in-memory que
  // `accessToken` — ver `partialize` más abajo, nunca se persiste cuando viene de esa rama.
  usuarioId: string | null;
  // SPEC-007 REQ-U8 — requerido para armar `x-empresa-id`. Solo lo trae la rama tenant
  // (LoginTenantResponse/PerfilCompletoResponse); sysadmin no tiene empresa, ver setSysAdminSession.
  empresaId: string | null;
  // Banderas de LoginTenantResponse que bloquean el dashboard con un modal hasta resolverse.
  mustChangePassword: boolean;
  requiereSeleccionSucursal: boolean;
}

interface SessionActions {
  setTenantSession: (payload: {
    accessToken: string;
    refreshToken: string;
    usuarioId: string;
    empresaId: string;
    mustChangePassword?: boolean;
    requiereSeleccionSucursal?: boolean;
  }) => void;
  // SPEC-007 REQ-U7 (adenda) — LoginSysAdminResponse no trae usuarioId/empresaId:
  // verificarSysAdmin.middleware.ts no exige x-usuario-id/x-empresa-id, a diferencia de
  // verificarToken.middleware.ts (rama tenant). Acción propia en vez de reusar setTenantSession para
  // no volver usuarioId/empresaId opcionales ahí, contradiciendo REQ-U8.
  setSysAdminSession: (payload: { accessToken: string; refreshToken: string }) => void;
  setOnboardingSession: (tokens: { onboardingToken: string; refreshToken: string; usuarioId: string }) => void;
  // SPEC-005 REQ-U3/E3/E4 — aplica el resultado de un refresh silencioso o de un reintento de
  // interceptor. Siempre actualiza accessToken; usuarioId/empresaId solo se actualizan cuando la
  // respuesta los trae (rama tenant, REQ-E3) — en la rama sysadmin (REQ-E4) se omiten y quedan como
  // estaban (null, ver setSysAdminSession). A diferencia de setTenantSession, NO resetea
  // onboardingToken ni las banderas mustChangePassword/requiereSeleccionSucursal.
  setAccessToken: (payload: { accessToken: string; usuarioId?: string; empresaId?: string }) => void;
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
  empresaId: null,
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
// SPEC-007 REQ-U8 — `usuarioId`/`empresaId` de la rama tenant tienen el mismo privilegio que
// `accessToken`: in-memory únicamente. `usuarioId` es un campo compartido con la rama onboarding
// (sí se persiste ahí), así que `partialize` solo lo incluye cuando `onboardingToken` también está
// presente — condición que es falsa en la rama tenant (setTenantSession siempre limpia
// onboardingToken a null). `empresaId` no se persiste bajo ninguna rama: no existe en onboarding.
export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      ...initialState,
      setTenantSession: ({
        accessToken,
        refreshToken,
        usuarioId,
        empresaId,
        mustChangePassword = false,
        requiereSeleccionSucursal = false,
      }) =>
        set({
          accessToken,
          refreshToken,
          usuarioId,
          empresaId,
          onboardingToken: null,
          mustChangePassword,
          requiereSeleccionSucursal,
        }),
      setSysAdminSession: ({ accessToken, refreshToken }) =>
        set({
          accessToken,
          refreshToken,
          onboardingToken: null,
          usuarioId: null,
          empresaId: null,
          mustChangePassword: false,
          requiereSeleccionSucursal: false,
        }),
      setOnboardingSession: ({ onboardingToken, refreshToken, usuarioId }) =>
        set({
          onboardingToken,
          refreshToken,
          usuarioId,
          empresaId: null,
          accessToken: null,
          mustChangePassword: false,
          requiereSeleccionSucursal: false,
        }),
      setAccessToken: ({ accessToken, usuarioId, empresaId }) =>
        set((state) => ({
          accessToken,
          usuarioId: usuarioId ?? state.usuarioId,
          empresaId: empresaId ?? state.empresaId,
        })),
      resolveMustChangePassword: () => set({ mustChangePassword: false }),
      resolveRequiereSeleccionSucursal: () => set({ requiereSeleccionSucursal: false }),
      clearSession: () => set(initialState),
    }),
    {
      name: 'onboarding-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        onboardingToken: state.onboardingToken,
        usuarioId: state.onboardingToken ? state.usuarioId : null,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
