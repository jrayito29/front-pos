import { Navigate, Outlet } from 'react-router';
import { useSessionStore } from '../stores/session.store';
import { ROUTES } from '../constants/routes';
import { useSessionHydrated } from './useSessionHydrated';

// Guard de /completar-perfil: requiere `onboardingToken`, no `accessToken` — es una sesión parcial
// distinta emitida solo cuando perfilCompleto=false (primer inicio de sesión, alta de empresa).
// Espera la rehidratación de `persist` antes de decidir el redirect (REQ-S5) para no expulsar a
// /login en el primer render de un reload legítimo a mitad del wizard.
//
// Por qué también se acepta `accessToken`: al completar el perfil (REQ-E4), setTenantSession limpia
// onboardingToken de forma síncrona, pero `navigate(ROUTES.DASHBOARD)` de react-router se aplica
// vía startTransition (diferido). Eso produce un render intermedio, todavía en /completar-perfil,
// con onboardingToken=null — sin este chequeo, ese render dispara un <Navigate to={LOGIN}/> que le
// gana la carrera a la navegación al dashboard (bug reproducido en
// test/app/CompletarPerfilFlow.test.tsx). Si ya hay `accessToken`, la sesión fue promovida
// legítimamente a tenant: se deja pasar y se confía en que la navegación pendiente aterrice.
export function RequireOnboarding() {
  const hydrated = useSessionHydrated();
  const onboardingToken = useSessionStore((state) => state.onboardingToken);
  const accessToken = useSessionStore((state) => state.accessToken);

  if (!hydrated) {
    return null;
  }

  if (!onboardingToken && !accessToken) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}
