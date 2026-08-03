import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { ROUTES } from '../constants/routes';
import { RouteStub } from './RouteStub';
import { RequireAuth } from './RequireAuth';
import { RequireOnboarding } from './RequireOnboarding';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { RouteLoadingSkeleton } from './RouteLoadingSkeleton';

// SPEC-006 REQ-U1/U4 — import() apunta al archivo propio de cada componente, NUNCA al barrel
// `features/auth` (aunque REQ-U3 exige que el barrel siga exportando normal). Si los 4 `lazy()`
// importaran el barrel, Vite/Rollup los colapsaría en un solo chunk async (mismo specifier = mismo
// límite de chunk), porque el barrel importa los 4 de forma estática — exactamente el problema que
// esta spec resuelve (visitar /login no debe descargar el wizard de completar-perfil). Excepción
// deliberada y documentada a la regla de "una feature solo se consume vía index.ts" (CLAUDE.md §3):
// `app/router.tsx` es la raíz de composición de la app, no una feature consumiendo a otra.
const AuthLayout = lazy(() =>
  import('../features/auth/pages/AuthLayout').then((m) => ({ default: m.AuthLayout }))
);
const LoginForm = lazy(() =>
  import('../features/auth/components/LoginForm').then((m) => ({ default: m.LoginForm }))
);
const RegistroForm = lazy(() =>
  import('../features/auth/components/RegistroForm').then((m) => ({ default: m.RegistroForm }))
);
const CompletarPerfilWizard = lazy(() =>
  import('../features/auth/components/CompletarPerfilWizard').then((m) => ({ default: m.CompletarPerfilWizard }))
);

export function AppRouter() {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteLoadingSkeleton />}>
        <Routes>
          {/* Públicas — panel compartido login/registro, toggle animado sin desmontar BrandPanel (SPEC-002 REQ-U10) */}
          <Route element={<AuthLayout />}>
            <Route path={ROUTES.LOGIN} element={<LoginForm />} />
            <Route path={ROUTES.REGISTRO} element={<RegistroForm />} />
          </Route>
          <Route path={ROUTES.OLVIDE_CONTRASENA} element={<RouteStub title="Recuperar contraseña" />} />
          <Route path={ROUTES.RESET_CONTRASENA} element={<RouteStub title="Restablecer contraseña" />} />

          {/* Onboarding — requiere onboardingToken (primer inicio de sesión, alta de empresa) */}
          <Route element={<RequireOnboarding />}>
            <Route path={ROUTES.COMPLETAR_PERFIL} element={<CompletarPerfilWizard />} />
          </Route>

          {/* Protegidas — requieren accessToken */}
          <Route element={<RequireAuth />}>
            <Route path={ROUTES.DASHBOARD} element={<RouteStub title="Dashboard" />} />
            <Route path={ROUTES.SYSADMIN} element={<RouteStub title="Panel Sysadmin" />} />
          </Route>

          <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}
