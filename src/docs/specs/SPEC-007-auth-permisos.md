# SPEC-007: Autorización en Frontend — Consumo de Permisos por Módulo y Acción

## Metadata

- **ID**: SPEC-007
- **Dominio**: auth
- **Versión**: 1.1.0
- **Estado**: draft — endpoint self-service ya disponible (REQ-U1 resuelto); **bloqueada por gap nuevo de `empresaId`** (ver REQ-U7/U8/U9 / §Dependencias)
- **Owner**: `Equipo Frontend POS-MX`
- **Creada**: 2026-07-29
- **Última revisión**: 2026-07-29

## Contexto

El backend (`api-pos`) ya implementa un sistema de autorización propio, documentado en `auth-permisos.spec.md` (ID interno `SPEC-003`, dominio `auth / admin`). Opera en dos dimensiones — **módulo** (`modulo.<clave>`, gate ON/OFF) y **acción** (`<modulo>.<accion>`, permiso específico) — resueltas en cuatro niveles de precedencia: `Plan` → `Empresa` → `Rol` → `Usuario` (el más específico gana). Los roles gestionables son `admin`, `gerente`, `almacenista`, `comprador`, `contador`, `rrhh` y `cajero` (`ROLES_CATALOGO`, `api-pos/src/constants/auth.constants.ts`); `superadmin` y `sysadmin` siempre tienen acceso total y no pasan por esta resolución. Los cambios de permisos aplican en tiempo real en el siguiente request del usuario afectado, sin requerir logout.

Esto significa que el frontend **no puede** hardcodear un mapa estático "rol → pantallas visibles": los permisos efectivos de un usuario dependen de su plan, su empresa, su rol y overrides individuales, y solo el backend puede resolverlos.

**Gap original, resuelto por backend**: hasta el 2026-07-29 el único endpoint que devolvía permisos efectivos de un usuario era `GET /admin/usuarios/:userId/permisos`, protegido por `verificarRole('superadmin')` — exclusivo de `superadmin`, inservible para que un usuario consultara sus propios permisos. Se solicitó formalmente vía `frontend-a-backend/PETICION-001-permisos-self-service.md`. Backend respondió (`api-pos/backend-a-frontend/RESPUESTA-001-permisos-self-service.md`) con un endpoint nuevo: `GET /auth/permisos`, guard `verificarToken` + `verificarSuscripcion` (sin `verificarRole`), `userId` resuelto del token (no acepta parámetro alguno — ni siquiera permite el intento de IDOR que motivó no simplemente relajar el guard del endpoint admin). REQ-U1 queda actualizado para describir el endpoint ya implementado, no ya como petición pendiente.

La forma de dato se mantiene sin cambios, tal como se propuso: `PermisosEfectivosUsuario { userId, role, modulos: ModuloEfectivo[] }`, con `ModuloEfectivo { modulo, activo, soloAdmin, fuenteModulo, esOverrideModulo, acciones: AccionEfectiva[] }` (`api-pos/src/interfaces/permisos.interfaces.ts`).

**Gap nuevo, encontrado al verificar el contrato de headers de la respuesta**: `GET /auth/permisos` exige `x-usuario-id` y `x-empresa-id`, "igual que el resto de rutas autenticadas del proyecto" (respuesta de backend). Se confirmó contra `api-pos/src/middlewares/verificarToken.middleware.ts`: en la rama TENANT (cualquier rol que no sea `PENDING_OWNER`), `x-empresa-id` es obligatorio para **toda** petición, no solo para este endpoint — no es una particularidad de permisos. Al revisar el frontend se encontraron tres huecos encadenados: (1) el request interceptor de `services/apiClient.ts` hoy solo adjunta `Authorization: Bearer accessToken` en la rama tenant, nunca `x-usuario-id`/`x-empresa-id`; (2) `session.store` no tiene ningún campo `empresaId`; (3) `LoginTenantResponse` (login normal, `perfilCompleto: true`) tampoco trae `empresaId` en su contrato — solo `PerfilCompletoResponse` (completar-perfil) lo incluye, y ni siquiera ese valor se está guardando hoy (`setTenantSession` no lo acepta como parámetro). Sin resolver esto, ninguna petición tenant autenticada puede armarse contra el backend real — no es exclusivo de permisos, bloquea a cualquier feature tenant futura, pero se documenta y resuelve aquí por ser el primer consumidor real de una ruta tenant con datos (mismo criterio que SPEC-004 REQ-U10, que resolvió la extensión de `apiClient.ts` dentro de la spec que primero la necesitó).

## Requisitos en formato EARS

### Ubiquitous (siempre aplica)

- **REQ-U1** _(resuelto por backend, 2026-07-29)_: El backend expone `GET /auth/permisos`, protegido únicamente con `verificarToken` + `verificarSuscripcion` (sin `verificarRole`), que resuelve los permisos efectivos del propio usuario autenticado a partir del `userId` del token — el endpoint no acepta `userId` como parámetro bajo ninguna forma — devolviendo `PermisosEfectivosUsuario`. Ref: `api-pos/backend-a-frontend/RESPUESTA-001-permisos-self-service.md`, `api-pos/src/routes/v1/auth.routes.ts` (`GET /permisos`), `api-pos/src/controllers/auth.controller.ts` (`getMisPermisos`).
- **REQ-U2**: El sistema DEBE exponer un hook `usePermisos()` en `features/auth/hooks/` que consulte el endpoint de REQ-U1 vía TanStack Query (`useQuery`), con `queryKey` que incluya el `usuarioId` de la sesión activa. Es dato de servidor — nunca se duplica en Zustand (CLAUDE.md §3).
- **REQ-U3**: A partir del resultado de `usePermisos()`, el sistema DEBE derivar funciones puras de consulta — `tieneModuloActivo(clave)` y `tieneAccion(clave)` — calculadas en cada uso, sin persistir ese resultado derivado en ningún store (CLAUDE.md §9, nunca guardar estado derivable).
- **REQ-U4**: El sistema DEBE crear un guard `app/RequirePermission`, análogo a `RequireAuth`/`RequireOnboarding`, que reciba la clave de módulo requerida (`modulo.<clave>`) y bloquee el render del `Outlet` si `tieneModuloActivo` (REQ-U3) es `false`.
- **REQ-U5**: El sistema DEBE combinar `RequirePermission` (REQ-U4) con el lazy-loading de rutas (SPEC-006 REQ-U1), de forma que el `import()` del chunk de una feature protegida solo se dispare cuando el usuario ya superó el guard — logrado de forma natural si `RequirePermission` envuelve la ruta y renderiza `<Navigate>` en vez de `<Outlet>` cuando el permiso es negativo, porque el componente lazy hijo nunca llega a montarse.
- **REQ-U6**: El menú de navegación de `AppLayout` (fuera de alcance de implementación de esta spec, pero contrato que debe respetar) DEBE ocultar cualquier entrada cuyo módulo no esté activo para el usuario según `tieneModuloActivo` — no basta con bloquear la ruta; la entrada tampoco debe ser visible ni enfocable por teclado.
- **REQ-U7** _(bloqueante, backend)_: `LoginTenantResponse` (`api-pos/src/interfaces/auth.interfaces.ts`) DEBE incluir **`usuarioId` y `empresaId`** explícitos. Se verificó el contrato actual y **faltan los dos**, no solo `empresaId`: `session.store.ts` confirma que `usuarioId` hoy solo se persiste vía `setOnboardingSession` — `setTenantSession` lo resetea a `null` explícitamente porque `LoginTenantResponse` nunca lo trajo. `PerfilCompletoResponse` (completar-perfil) sí incluye `empresaId` desde SPEC-004, pero ninguna de las dos respuestas de login/completar-perfil expone `usuarioId` en la rama tenant. Sin ambos campos, un usuario con login normal (no pasa por completar-perfil) no tiene ninguna fuente para `x-usuario-id` ni `x-empresa-id` — decodificar el JWT está prohibido por CLAUDE.md §6. Ver `frontend-a-backend/PETICION-002-contexto-tenant-login.md`.
- **REQ-U8**: `session.store` DEBE persistir `usuarioId` y `empresaId` en la rama tenant — únicamente in-memory, mismo tratamiento que `accessToken` (nunca en `sessionStorage`, ver SPEC-005 REQ-U1): viajan siempre junto al `accessToken` para armar `x-usuario-id`/`x-empresa-id`, y son dato del mismo nivel de privilegio. `setTenantSession` DEBE aceptar ambos como parámetros obligatorios (hoy no acepta ninguno de los dos — `usuarioId` se resetea a `null` a propósito, y `empresaId` se descarta incluso cuando ya viene en la respuesta de completar-perfil, ver SPEC-004 REQ-E4).
- **REQ-U9**: El request interceptor de `services/apiClient.ts` DEBE adjuntar `x-usuario-id` y `x-empresa-id` en la rama tenant (cuando existe `accessToken`) — hoy solo adjunta `Authorization: Bearer accessToken`. Depende de REQ-U7/U8 resueltos. Sin este REQ, ninguna petición tenant autenticada (incluida `GET /auth/permisos` de REQ-U1) puede completarse contra el backend real — el middleware `verificarToken` la rechaza con `ERR_MISSING_CONTEXT` (401).

### State-driven (mientras X)

- **REQ-S1**: Mientras `usePermisos()` esté en `isLoading` (primera carga tras login o reload), `RequirePermission` (REQ-U4) DEBE mostrar un estado de espera (skeleton, no spinner genérico — CLAUDE.md §8) en vez de resolver prematuramente el permiso como `false`.
- **REQ-S2**: Mientras la sesión esté activa, el sistema DEBE mantener los permisos sincronizables sin requerir logout/login, invalidando la query de `usePermisos()` cuando corresponda (ver REQ-E1) — consistente con la regla de negocio del backend de que los cambios de permisos aplican en tiempo real (`api-pos` `auth-permisos.spec.md` §Contexto).

### Event-driven (cuando X)

- **REQ-E1**: Cuando el sistema reciba `ERR_PERMISSION_DENIED` (403) en cualquier petición — el backend revalida permisos en cada request, no confía en el estado cacheado del front —, el sistema DEBE invalidar la query de `usePermisos()` (`queryClient.invalidateQueries`) antes de mostrar cualquier UI que dependa de ella, porque el front puede estar desactualizado si un `superadmin` cambió los permisos del usuario durante la sesión en curso.
- **REQ-E2**: Cuando el usuario navegue a una ruta protegida por `RequirePermission` sin el módulo activo, el sistema DEBE redirigir a una vista de "acceso no autorizado" — no a `/login`: la sesión sigue siendo válida, es un problema de autorización, no de autenticación.

### Unwanted (si X entonces)

- **REQ-X1**: Si el endpoint de REQ-U1 responde un error inesperado (no 401/403), el sistema DEBE tratarlo como "sin permisos" por defecto — fail-closed, nunca fail-open —, ocultando/bloqueando en vez de asumir acceso. Consistente con la filosofía fail-fast del backend (`GOBERNANZA.md §1`).
- **REQ-X2**: Si `usePermisos()` falla por error de red (no un 401/403 de negocio), el sistema DEBE comunicarlo vía el interceptor centralizado (toast) y mantener el estado como "sin permisos confirmados" (mismo fail-closed de REQ-X1) hasta que la query se recupere — nunca interpretar un resultado `undefined` como acceso total por omisión.

## Criterios de aceptación

Cada REQ de arriba DEBE tener al menos un test que:

1. Lo referencia por ID exacto en un comentario: `// spec:SPEC-007:REQ-<X>`
2. Falla si el requisito no se cumple
3. Se ejecuta en `npm test` sin configuración adicional

## Tests trazados

_Pendiente — spec bloqueada en estado `draft` por el gap de backend (REQ-U1). Se completa esta sección al pasar a `active`._

## Auditoría

> Ref: **api-pos SPEC-003** (`auth-permisos.spec.md`) / **api-pos SPEC-008** (`auditoria.spec.md`)

Sin eventos de auditoría propios del front. Todo cambio de permiso (`PERM_ROLE_MODULE_UPDATED`, `PERM_ROLE_ACTION_UPDATED`, `PERM_ROLE_RESET`, `PERM_USER_MODULE_OVERRIDE`, `PERM_USER_ACTION_OVERRIDE`, `PERM_USER_RESET` — `api-pos/src/constants/audit.constants.ts`) ya se audita en backend cuando un `superadmin` lo ejecuta desde el panel de gestión; eso queda fuera de alcance de esta spec, que solo cubre el consumo de solo-lectura desde el front. El endpoint self-service propuesto en REQ-U1 es `GET` y no requiere una constante nueva en `AUDIT_ACTIONS`.

## Dependencias

- **Resuelto** (backend): endpoint de REQ-U1 — `GET /auth/permisos`, ver `api-pos/backend-a-frontend/RESPUESTA-001-permisos-self-service.md`. Ya no bloquea.
- **Depende de** (backend, bloqueante nuevo): REQ-U7 — `usuarioId`/`empresaId` explícitos en `LoginTenantResponse`. Petición enviada: `frontend-a-backend/PETICION-002-contexto-tenant-login.md`. Sin esto, REQ-U8/U9 no pueden implementarse contra el backend real y esta spec permanece en `draft`.
- **Depende de** (backend, contrato): `interfaces/permisos.interfaces.ts` (`PermisosEfectivosUsuario`, `ModuloEfectivo`, `AccionEfectiva`), `constants/permisos.constants.ts` (`PERMISOS_ERRORS.PERMISSION_DENIED` = `ERR_PERMISSION_DENIED`), `constants/auth.constants.ts` (`ROLES_CATALOGO`), `middlewares/verificarToken.middleware.ts` (contrato de headers `x-usuario-id`/`x-empresa-id` obligatorios en rama tenant, motivo de REQ-U7/U8/U9).
- **Depende de**: SPEC-005 (Sesión Tenant) — REQ-U8 de esta spec sigue el mismo tratamiento de privilegio in-memory que SPEC-005 REQ-U1/U3 definió para `accessToken`.
- **Depende de**: SPEC-006 (Code Splitting) — REQ-U5 de esta spec combina ambos contratos.
- **Depende de**: SPEC-002 (Login) y SPEC-004 (Completar Perfil) — dueñas de `setTenantSession`/`LoginTenantResponse` y `PerfilCompletoResponse` respectivamente, que REQ-U7/U8 extienden.
- **Bloquea**: toda feature de dominio (ventas, inventario, productos, almacenes, clientes, admin) que deba ocultar o bloquear UI según rol/permiso, y también cualquier feature que simplemente necesite hacer una petición tenant autenticada — ninguna debe implementar su propio manejo de `x-empresa-id` ad-hoc; todas dependen de REQ-U9 (interceptor).
- **Riesgo documentado**: se puede adelantar el trabajo de frontend que no dependa de REQ-U7 (tipos, `RequirePermission` contra mock), pero `usePermisos`/REQ-U8/REQ-U9 no pueden validarse contra el backend real hasta que `LoginTenantResponse` incluya `usuarioId`/`empresaId` — la spec no pasa a `Estado: active` hasta entonces, para no documentar como vigente un contrato no verificado.

## Cambios

- v1.1.0 (2026-07-29): Backend respondió `PETICION-001` — `GET /auth/permisos` implementado y disponible (REQ-U1 actualizado de "bloqueante" a "resuelto"). Al verificar el contrato de headers de la respuesta contra `verificarToken.middleware.ts`, se encontró un gap nuevo y más amplio: el frontend no tiene forma de armar `x-usuario-id`/`x-empresa-id` en ninguna petición tenant (interceptor incompleto + `session.store` sin `empresaId` + `LoginTenantResponse` sin `usuarioId` ni `empresaId`). Se agregan REQ-U7 (bloqueante, backend — pedido en `PETICION-002`), REQ-U8 (`session.store`) y REQ-U9 (interceptor) para resolverlo dentro de esta spec, por ser el primer consumidor real de una ruta tenant con datos (mismo criterio que SPEC-004 REQ-U10).
- v1.0.0 (2026-07-29): Versión inicial (`draft`). Documenta el modelo de autorización del backend, el contrato de datos a reutilizar, y el gap bloqueante encontrado (no existe endpoint self-service de permisos).
