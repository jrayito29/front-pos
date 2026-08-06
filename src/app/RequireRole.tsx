import { Navigate, Outlet } from 'react-router';
import { usePermisos } from '../features/auth/hooks/usePermisos';
import { ROUTES } from '../constants/routes';
import { Skeleton } from '../components/Skeleton';

interface RequireRoleProps {
  // Rol de plataforma estático a exigir (ej. "superadmin") — comparado directamente contra
  // `PermisosEfectivosUsuario.role`, sin pasar por el catálogo dinámico de permisos. SPEC-011
  // REQ-U2/U3: el módulo de Usuarios no tiene una clave `modulo.usuarios` — el backend gatea sus
  // endpoints con `verificarRole('superadmin')` directo, no `verificarPermiso`.
  role: string;
}

// SPEC-011 REQ-U2 — skeleton mientras usePermisos() resuelve la primera carga; mismo criterio que
// RequirePermission (nunca resolver el rol como no autorizado prematuramente, CLAUDE.md §8).
function RoleCheckingSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col gap-4 p-6" role="status" aria-busy="true" aria-label="Verificando permisos">
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

// Guard de rutas protegidas por rol estático — análogo a RequirePermission (SPEC-007), pero
// comparando `role` en vez de resolver módulo/acción por el catálogo dinámico de permisos. Reutiliza
// el mismo usePermisos() (self-service, `GET /auth/permisos` ya disponible para cualquier usuario
// tenant autenticado) — nunca un endpoint ni un hook nuevo solo para leer el rol. Se anida DEBAJO de
// RequireAuth, igual que RequirePermission.
export function RequireRole({ role }: RequireRoleProps) {
  const { data, isLoading, isError } = usePermisos();

  if (isLoading) {
    return <RoleCheckingSkeleton />;
  }

  // Fail-closed: un error de red/servidor dejaría `isError` en true y `data` en `undefined` — cae en
  // la misma rama que "el rol no coincide", nunca se interpreta como acceso por omisión (mismo
  // criterio que RequirePermission REQ-X1).
  if (isError || data?.role !== role) {
    // No autenticación (no /login): la sesión sigue siendo válida, es un problema de autorización.
    return <Navigate to={ROUTES.NO_AUTORIZADO} replace />;
  }

  return <Outlet />;
}
