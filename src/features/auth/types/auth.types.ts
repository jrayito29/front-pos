// Tipos propios del front, recreados 1:1 desde api-pos/src/interfaces/auth.interfaces.ts
// (no se importan directamente — proyectos separados). Ver SPEC-002 §Dependencias.

export interface LoginTenantResponse {
  accessToken: string;
  refreshToken: string;
  perfilCompleto: true;
  sessionConflict?: boolean;
  subscriptionExpired?: boolean;
  subscriptionEnGracia?: boolean;
  mustChangePassword?: boolean;
  sucursalActivaId?: string;
  requiereSeleccionSucursal?: boolean;
}

export interface LoginOnboardingResponse {
  onboardingToken: string;
  refreshToken: string;
  usuarioId: string;
  perfilCompleto: false;
  sessionConflict?: boolean;
}

// SPEC-004 §Contexto/REQ-U10 — misma respuesta que emite POST /refresh cuando la sesión vigente
// es de onboarding (rama de recovery, ver verificarToken.middleware.ts §ONBOARDING BRANCH).
export interface RefreshOnboardingResponse {
  onboardingToken: string;
  usuarioId: string;
  perfilCompleto: false;
}

// SPEC-004 REQ-E4 — resuelve POST /auth/completar-perfil; transición de sesión parcial a completa.
export interface PerfilCompletoResponse {
  accessToken: string;
  refreshToken: string;
  empresaId: string;
  perfilCompleto: true;
}

export interface LoginSysAdminResponse {
  accessToken: string;
  refreshToken: string;
}

export type LoginResponse = LoginTenantResponse | LoginOnboardingResponse | LoginSysAdminResponse;

export interface PreRegistroResponse {
  userId: string;
  email: string;
  // TEMPORAL — DEV ONLY. Ausente cuando NODE_ENV=production en el backend. Ver SPEC-003 §Riesgo documentado.
  verificationTokenDevOnly?: string;
}
