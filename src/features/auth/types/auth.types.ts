// Tipos propios del front, recreados 1:1 desde api-pos/src/interfaces/auth.interfaces.ts
// (no se importan directamente — proyectos separados). Ver SPEC-002 §Dependencias.

export interface LoginTenantResponse {
  accessToken: string;
  refreshToken: string;
  // Expuestos explícitos para armar x-usuario-id/x-empresa-id sin decodificar el JWT (CLAUDE.md §6).
  // Ref: SPEC-007 REQ-U7, api-pos RESPUESTA-002-contexto-tenant-login.md
  usuarioId: string;
  empresaId: string;
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

// SPEC-005 REQ-E3 — misma respuesta que emite POST /refresh cuando la sesión vigente es tenant.
// usuarioId/empresaId requeridos (no opcionales), mismo criterio que LoginTenantResponse (REQ-U7).
// Ref: RESPUESTA-004-usuarioid-empresaid-en-refresh-tenant.md
export interface RefreshTenantResponse {
  accessToken: string;
  usuarioId: string;
  empresaId: string;
}

// SPEC-005 REQ-E4 — rama explícita cuando la sesión vigente es sysadmin. Nunca trae
// usuarioId/empresaId: es el discriminador entre esta rama y RefreshTenantResponse (REQ-U6).
export interface RefreshSysAdminResponse {
  accessToken: string;
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
