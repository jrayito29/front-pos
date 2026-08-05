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
  // SPEC-008 — módulos de negocio (contexto tenant), montados dentro de AppLayout y protegidos por
  // RequirePermission con la clave `modulo.<clave>` correspondiente (ver navConfig.ts).
  VENTAS: '/ventas',
  COTIZACIONES: '/cotizaciones',
  INVENTARIO: '/inventario',
  PRODUCTOS: '/productos',
  // SPEC-009 — ruta propia para el formulario en blanco (REQ-U19); el patrón `:id` se usa tal cual
  // en `<Route path=...>` (app/router.tsx) y `productoDetalleRoute()` (abajo) construye el href real.
  PRODUCTOS_NUEVO: '/productos/nuevo',
  PRODUCTOS_DETALLE: '/productos/:id',
  ALMACENES: '/almacenes',
  CLIENTES: '/clientes',
  // Módulo de gestión de Categorías — crear/editar/detalle viven en modales sobre este único listado
  // (decisión de producto: pocos campos, no ameritan rutas propias como Productos), protegido por
  // RequirePermission con `modulo.categorias` (independiente de `modulo.productos`/`modulo.inventario`,
  // ver SPEC-003 seed). Agrupado bajo "Configuración" en el sidebar (navConfig.ts) — agrupación
  // puramente visual del frontend, sin relación con `modulo.configuracion` del backend.
  CATEGORIAS: '/categorias',
  SYSADMIN: '/admin',
  // SPEC-008 REQ-U11 — panel de plataforma, menú estructuralmente distinto al tenant. Sysadmin no
  // pasa por RequirePermission (SPEC-007 §Contexto: acceso total, sin resolución de permisos).
  SYSADMIN_EMPRESAS: '/admin/empresas',
  SYSADMIN_PLANES: '/admin/planes',
  SYSADMIN_USUARIOS: '/admin/usuarios',
  SYSADMIN_AUDITORIA: '/admin/auditoria',
  // SPEC-007 REQ-E2 — destino de RequirePermission cuando el módulo no está activo para el usuario.
  // No es /login: la sesión sigue siendo válida, es un problema de autorización, no de autenticación.
  NO_AUTORIZADO: '/no-autorizado',
} as const;

// SPEC-009 — primera ruta dinámica del proyecto (sin precedente previo): `ROUTES.PRODUCTOS_DETALLE`
// es el patrón `:id` que consume `<Route path=...>`; esta función construye el href real para
// `navigate()`/`<Link>`. Vive fuera de `ROUTES` porque no es un valor estático.
export const productoDetalleRoute = (id: string): string => `/productos/${id}`;
