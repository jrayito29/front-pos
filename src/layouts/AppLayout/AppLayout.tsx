import { useSessionStore } from '../../stores/session.store';
import { TenantChrome } from './TenantChrome';
import { SysadminChrome } from './SysadminChrome';

// SPEC-008 REQ-U1 — layout de React Router para toda ruta bajo RequireAuth. `empresaId` es `null`
// únicamente en la rama sysadmin (`session.store` `setSysAdminSession`) — señal ya existente en el
// store, más confiable que inspeccionar el pathname (no depende de que el usuario ya haya navegado).
export function AppLayout() {
  const empresaId = useSessionStore((state) => state.empresaId);
  return empresaId ? <TenantChrome /> : <SysadminChrome />;
}
