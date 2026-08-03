import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useSessionStore } from '../stores/session.store';
import { ROUTES } from '../constants/routes';
import { ModalStub } from './ModalStub';
import { useSessionHydrated } from './useSessionHydrated';
import { refreshTenantAccessToken } from '../services/apiClient';
import { Skeleton } from '../components/Skeleton';

type TenantAuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

// SPEC-005 REQ-U4/U5 — espera la rehidratación de `persist` y, si hay `refreshToken` pero no
// `accessToken` en memoria (reload con sesión de tenant activa), dispara un refresh silencioso
// contra POST /auth/refresh antes de decidir si la sesión es válida. `refreshFailed` evita
// reintentar en loop tras un fallo ya resuelto (REQ-X1).
function useTenantAuthStatus(): TenantAuthStatus {
  const hydrated = useSessionHydrated();
  const accessToken = useSessionStore((state) => state.accessToken);
  const refreshToken = useSessionStore((state) => state.refreshToken);
  const [refreshFailed, setRefreshFailed] = useState(false);

  useEffect(() => {
    if (!hydrated || accessToken || !refreshToken || refreshFailed) return;

    let cancelled = false;
    refreshTenantAccessToken(refreshToken).catch(() => {
      if (cancelled) return;
      // SPEC-005 REQ-X1 — fallo del silent-refresh de bootstrap: limpia sesión y redirige sin toast,
      // a diferencia de REQ-X2 (fallo del interceptor), que sí interrumpe una acción del usuario.
      useSessionStore.getState().clearSession();
      setRefreshFailed(true);
    });

    return () => {
      cancelled = true;
    };
  }, [hydrated, accessToken, refreshToken, refreshFailed]);

  if (!hydrated) return 'checking';
  if (accessToken) return 'authenticated';
  if (refreshToken && !refreshFailed) return 'checking';
  return 'unauthenticated';
}

// SPEC-005 REQ-S1 — skeleton mientras se resuelve la rehidratación o el silent-refresh; nunca un
// spinner genérico (CLAUDE.md §8). `AppLayout` real (sidebar + header + contenido) todavía no existe
// como feature — se aproxima su forma.
function AuthCheckingSkeleton() {
  return (
    <div className="flex min-h-dvh" role="status" aria-busy="true" aria-label="Verificando sesión">
      <div className="hidden w-64 flex-col gap-3 border-r border-border bg-background-secondary p-4 lg:flex">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

// Guard de rutas protegidas por `accessToken` (dashboard tenant y panel sysadmin).
// SPEC-005 — espera hidratación de `persist` e intenta un refresh silencioso antes de redirigir a
// /login, para que un reload con sesión de tenant activa no fuerce un re-login (ver REQ-U4/U5).
// Si la sesión tenant trae mustChangePassword/requiereSeleccionSucursal pendientes, bloquea la
// interacción con un modal en vez de redirigir a una ruta propia (decisión de producto: no
// escribir rutas para estos dos flujos). mustChangePassword tiene prioridad sobre la sucursal.
export function RequireAuth() {
  const status = useTenantAuthStatus();
  const mustChangePassword = useSessionStore((state) => state.mustChangePassword);
  const requiereSeleccionSucursal = useSessionStore((state) => state.requiereSeleccionSucursal);

  if (status === 'checking') {
    return <AuthCheckingSkeleton />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return (
    <>
      <Outlet />
      {mustChangePassword && <ModalStub title="Cambiar contraseña temporal" />}
      {!mustChangePassword && requiereSeleccionSucursal && <ModalStub title="Seleccionar sucursal" />}
    </>
  );
}
