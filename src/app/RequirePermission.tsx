import { Navigate, Outlet } from 'react-router';
// SPEC-006 REQ-U1 (misma excepción que app/router.tsx) — import directo al archivo, no al barrel
// `features/auth`: este guard se monta de forma eager (SPEC-008 lo usa directamente en router.tsx,
// fuera de cualquier lazy()) y el barrel también re-exporta AuthLayout/LoginForm/RegistroForm/
// CompletarPerfilWizard — si importara el barrel, esos componentes (hoy separados en sus propios
// chunks async) quedarían arrastrados al chunk principal.
import { usePermisos, tieneAccesoTotal, tieneModuloActivo } from '../features/auth/hooks/usePermisos';
import { ROUTES } from '../constants/routes';
import { Skeleton } from '../components/Skeleton';

interface RequirePermissionProps {
  // Formato "modulo.<clave>" — ver features/auth/types/permisos.types.ts (ModuloEfectivo.modulo).
  modulo: string;
}

// SPEC-007 REQ-S1 — skeleton mientras usePermisos() resuelve la primera carga; nunca resolver el
// permiso como `false` prematuramente (CLAUDE.md §8, nunca spinner genérico).
function PermissionCheckingSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col gap-4 p-6" role="status" aria-busy="true" aria-label="Verificando permisos">
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

// Guard de rutas protegidas por módulo — análogo a RequireAuth/RequireOnboarding, pero de
// autorización, no de autenticación. Se anida DEBAJO de RequireAuth (requiere accessToken/usuarioId
// activos, ver usePermisos). REQ-U5: al renderizar <Navigate> en vez de <Outlet> cuando el permiso es
// negativo, el `lazy()` de la ruta hija nunca se monta — su chunk no se descarga.
// REQ-X1/X2 (fail-closed): tieneModuloActivo resuelve `undefined` (error o sin datos) como `false`,
// nunca como acceso por omisión — ver usePermisos.ts.
export function RequirePermission({ modulo }: RequirePermissionProps) {
  const { data, isLoading } = usePermisos();

  if (isLoading) {
    return <PermissionCheckingSkeleton />;
  }

  // RESPUESTA-003-datos-usuario-y-logo-empresa.md — `superadmin` responde `accesoTotal: true` con
  // `modulos: []`; sin este bypass, tieneModuloActivo siempre resolvería `false` para ese rol (fail-
  // closed sobre un arreglo vacío) y lo mandaría a /no-autorizado pese a tener acceso total.
  if (!tieneAccesoTotal(data) && !tieneModuloActivo(data?.modulos, modulo)) {
    // REQ-E2 — no autenticación (no /login): la sesión sigue siendo válida.
    return <Navigate to={ROUTES.NO_AUTORIZADO} replace />;
  }

  return <Outlet />;
}
