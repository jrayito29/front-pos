// Públicas: accesibles sin sesión.
// LOGIN y REGISTRO renderizan el mismo panel compartido (ver features/auth/pages/AuthLayout) —
// alternar entre ambos es un toggle animado en el mismo componente, no una navegación completa
// (ver SPEC-002 REQ-U10/E8).
// COMPLETAR_PERFIL requiere `onboardingToken` (sesión parcial post-verificación), no `accessToken` —
// no es pública, pero usa un guard distinto al resto de las protegidas (ver app/RequireOnboarding).
// Selección de sucursal y cambio de contraseña temporal NO son rutas — son modales bloqueantes
// sobre el dashboard, gatillados por las banderas de la respuesta de login (ver stores/session.store).
export const ROUTES = {
  LOGIN: '/login',
  REGISTRO: '/registro',
  OLVIDE_CONTRASENA: '/olvide-contrasena',
  RESET_CONTRASENA: '/reset-contrasena',
  COMPLETAR_PERFIL: '/completar-perfil',
  DASHBOARD: '/',
  SYSADMIN: '/admin',
} as const;
