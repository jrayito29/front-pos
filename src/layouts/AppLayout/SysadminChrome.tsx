import { SYSADMIN_NAV } from './navConfig';
import { Shell } from './Shell';

// SPEC-008 REQ-U11/X4 — menú de plataforma fijo, no una variante filtrada del tenant. Nunca llama
// usePermisos(): sysadmin no pasa por resolución de permisos (SPEC-007 §Contexto: acceso total),
// así que ni siquiera se dispara la petición de red.
export function SysadminChrome() {
  return <Shell navItems={SYSADMIN_NAV} navAriaLabel="Navegación de plataforma" role="Sysadmin" />;
}
