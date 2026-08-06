import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { ROUTES } from '../constants/routes';
import { RouteStub } from './RouteStub';
import { RequireAuth } from './RequireAuth';
import { RequireOnboarding } from './RequireOnboarding';
import { RequirePermission } from './RequirePermission';
import { RequireRole } from './RequireRole';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { RouteLoadingSkeleton } from './RouteLoadingSkeleton';
// SPEC-008 — shell compartido (sidebar/topbar/scroll de contenido) para toda ruta protegida. Import
// eager, no lazy: se necesita para el primer render de cualquier ruta bajo RequireAuth, no hay
// beneficio de code-splitting en diferirlo.
import { AppLayout } from '../layouts/AppLayout';

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

// SPEC-009 — mismo criterio (SPEC-006 REQ-U1/U4): import() al archivo propio de cada página, no al
// barrel `features/productos` (colapsaría las 3 rutas en un solo chunk async).
const ProductosListPage = lazy(() =>
  import('../features/productos/pages/ProductosListPage').then((m) => ({ default: m.ProductosListPage }))
);
const ProductoCrearPage = lazy(() =>
  import('../features/productos/pages/ProductoCrearPage').then((m) => ({ default: m.ProductoCrearPage }))
);
const ProductoDetallePage = lazy(() =>
  import('../features/productos/pages/ProductoDetallePage').then((m) => ({ default: m.ProductoDetallePage }))
);

// Módulo de Categorías — una sola ruta (crear/editar/detalle son modales sobre CategoriasListPage,
// no rutas propias), mismo criterio de import directo al archivo (no al barrel `features/categorias`).
const CategoriasListPage = lazy(() =>
  import('../features/categorias/pages/CategoriasListPage').then((m) => ({ default: m.CategoriasListPage }))
);

// Módulo de Usuarios (SPEC-011) — misma decisión de "una sola ruta, modales" que Categorías; import
// directo al archivo (no al barrel `features/usuarios`).
const UsuariosListPage = lazy(() =>
  import('../features/usuarios/pages/UsuariosListPage').then((m) => ({ default: m.UsuariosListPage }))
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

          {/* SPEC-007 REQ-E2 — destino de RequirePermission cuando el módulo no está activo. No va
              detrás de RequireAuth: si la sesión llegara a expirar entre el redirect y el render,
              debe seguir siendo alcanzable en vez de rebotar a /login por un problema distinto. */}
          <Route path={ROUTES.NO_AUTORIZADO} element={<RouteStub title="Acceso no autorizado" />} />

          {/* Onboarding — requiere onboardingToken (primer inicio de sesión, alta de empresa) */}
          <Route element={<RequireOnboarding />}>
            <Route path={ROUTES.COMPLETAR_PERFIL} element={<CompletarPerfilWizard />} />
          </Route>

          {/* Protegidas — requieren accessToken. SPEC-008: AppLayout envuelve todo (sidebar/topbar/
              scroll de contenido); RequirePermission gatea cada módulo tenant individualmente
              (SPEC-007 REQ-U4/U5) — sysadmin no pasa por esa resolución (SPEC-007 §Contexto), sus
              rutas quedan directamente bajo AppLayout sin ese guard adicional. */}
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path={ROUTES.DASHBOARD} element={<RouteStub title="Dashboard" />} />

              <Route element={<RequirePermission modulo="modulo.ventas" />}>
                <Route path={ROUTES.VENTAS} element={<RouteStub title="Ventas" />} />
              </Route>
              <Route element={<RequirePermission modulo="modulo.cotizaciones" />}>
                <Route path={ROUTES.COTIZACIONES} element={<RouteStub title="Cotizaciones" />} />
              </Route>
              <Route element={<RequirePermission modulo="modulo.inventario" />}>
                <Route path={ROUTES.INVENTARIO} element={<RouteStub title="Inventario" />} />
              </Route>
              <Route element={<RequirePermission modulo="modulo.productos" />}>
                <Route path={ROUTES.PRODUCTOS} element={<ProductosListPage />} />
                <Route path={ROUTES.PRODUCTOS_NUEVO} element={<ProductoCrearPage />} />
                <Route path={ROUTES.PRODUCTOS_DETALLE} element={<ProductoDetallePage />} />
              </Route>
              <Route element={<RequirePermission modulo="modulo.categorias" />}>
                <Route path={ROUTES.CATEGORIAS} element={<CategoriasListPage />} />
              </Route>
              {/* SPEC-011 REQ-U3 — gate por rol estático (RequireRole), no por RequirePermission: no
                  existe `modulo.usuarios` en el catálogo dinámico de permisos. */}
              <Route element={<RequireRole role="superadmin" />}>
                <Route path={ROUTES.USUARIOS} element={<UsuariosListPage />} />
              </Route>
              <Route element={<RequirePermission modulo="modulo.almacenes" />}>
                <Route path={ROUTES.ALMACENES} element={<RouteStub title="Almacenes" />} />
              </Route>
              <Route element={<RequirePermission modulo="modulo.clientes" />}>
                <Route path={ROUTES.CLIENTES} element={<RouteStub title="Clientes" />} />
              </Route>

              <Route path={ROUTES.SYSADMIN} element={<RouteStub title="Panel Sysadmin" />} />
              <Route path={ROUTES.SYSADMIN_EMPRESAS} element={<RouteStub title="Empresas" />} />
              <Route path={ROUTES.SYSADMIN_PLANES} element={<RouteStub title="Planes" />} />
              <Route path={ROUTES.SYSADMIN_USUARIOS} element={<RouteStub title="Usuarios" />} />
              <Route path={ROUTES.SYSADMIN_AUDITORIA} element={<RouteStub title="Auditoría" />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}
