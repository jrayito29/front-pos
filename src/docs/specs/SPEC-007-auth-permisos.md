# SPEC-007: Autorización en Frontend — Consumo de Permisos por Módulo y Acción

## Metadata

- **ID**: SPEC-007
- **Dominio**: auth
- **Versión**: 1.3.0
- **Estado**: active — REQ-U7 resuelto por backend (`RESPUESTA-002-contexto-tenant-login.md`), REQ-U8/U9 implementados y verificados contra el contrato real. REQ-U10 (`accesoTotal`) resuelto por backend (`RESPUESTA-003-datos-usuario-y-logo-empresa.md`) e implementado. REQ-U6 ya no está fuera de alcance — `AppLayout` existe (SPEC-008) y lo implementa. Todos los REQ tienen test trazado (ver §Tests trazados).
- **Owner**: `Equipo Frontend POS-MX`
- **Creada**: 2026-07-29
- **Última revisión**: 2026-08-03

## Contexto

El backend (`api-pos`) ya implementa un sistema de autorización propio, documentado en `auth-permisos.spec.md` (ID interno `SPEC-003`, dominio `auth / admin`). Opera en dos dimensiones — **módulo** (`modulo.<clave>`, gate ON/OFF) y **acción** (`<modulo>.<accion>`, permiso específico) — resueltas en cuatro niveles de precedencia: `Plan` → `Empresa` → `Rol` → `Usuario` (el más específico gana). Los roles gestionables son `admin`, `gerente`, `almacenista`, `comprador`, `contador`, `rrhh` y `cajero` (`ROLES_CATALOGO`, `api-pos/src/constants/auth.constants.ts`); `superadmin` y `sysadmin` siempre tienen acceso total y no pasan por esta resolución. Los cambios de permisos aplican en tiempo real en el siguiente request del usuario afectado, sin requerir logout.

Esto significa que el frontend **no puede** hardcodear un mapa estático "rol → pantallas visibles": los permisos efectivos de un usuario dependen de su plan, su empresa, su rol y overrides individuales, y solo el backend puede resolverlos.

**Gap original, resuelto por backend**: hasta el 2026-07-29 el único endpoint que devolvía permisos efectivos de un usuario era `GET /admin/usuarios/:userId/permisos`, protegido por `verificarRole('superadmin')` — exclusivo de `superadmin`, inservible para que un usuario consultara sus propios permisos. Se solicitó formalmente vía `frontend-a-backend/PETICION-001-permisos-self-service.md`. Backend respondió (`api-pos/backend-a-frontend/RESPUESTA-001-permisos-self-service.md`) con un endpoint nuevo: `GET /auth/permisos`, guard `verificarToken` + `verificarSuscripcion` (sin `verificarRole`), `userId` resuelto del token (no acepta parámetro alguno — ni siquiera permite el intento de IDOR que motivó no simplemente relajar el guard del endpoint admin). REQ-U1 queda actualizado para describir el endpoint ya implementado, no ya como petición pendiente.

La forma de dato se mantiene sin cambios, tal como se propuso: `PermisosEfectivosUsuario { userId, role, modulos: ModuloEfectivo[] }`, con `ModuloEfectivo { modulo, activo, soloAdmin, fuenteModulo, esOverrideModulo, acciones: AccionEfectiva[] }` (`api-pos/src/interfaces/permisos.interfaces.ts`).

**Gap nuevo, encontrado al verificar el contrato de headers de la respuesta**: `GET /auth/permisos` exige `x-usuario-id` y `x-empresa-id`, "igual que el resto de rutas autenticadas del proyecto" (respuesta de backend). Se confirmó contra `api-pos/src/middlewares/verificarToken.middleware.ts`: en la rama TENANT (cualquier rol que no sea `PENDING_OWNER`), `x-empresa-id` es obligatorio para **toda** petición, no solo para este endpoint — no es una particularidad de permisos. Al revisar el frontend se encontraron tres huecos encadenados: (1) el request interceptor de `services/apiClient.ts` hoy solo adjunta `Authorization: Bearer accessToken` en la rama tenant, nunca `x-usuario-id`/`x-empresa-id`; (2) `session.store` no tiene ningún campo `empresaId`; (3) `LoginTenantResponse` (login normal, `perfilCompleto: true`) tampoco trae `empresaId` en su contrato — solo `PerfilCompletoResponse` (completar-perfil) lo incluye, y ni siquiera ese valor se está guardando hoy (`setTenantSession` no lo acepta como parámetro). Sin resolver esto, ninguna petición tenant autenticada puede armarse contra el backend real — no es exclusivo de permisos, bloquea a cualquier feature tenant futura, pero se documenta y resuelve aquí por ser el primer consumidor real de una ruta tenant con datos (mismo criterio que SPEC-004 REQ-U10, que resolvió la extensión de `apiClient.ts` dentro de la spec que primero la necesitó).

**Bug encontrado en producción (2026-08-03) y resuelto por backend**: `GET /auth/permisos` respondía `403 ERR_SUPERADMIN_PROTECTED` para cualquier usuario tenant con rol `superadmin` — el §Contexto de arriba ya documentaba que ese rol "siempre tiene acceso total y no pasa por esta resolución", pero el backend expresaba esa regla como un error en vez de una respuesta `200` con acceso total, porque reutilizaba sin distinguir la misma validación que protege a un superadmin de ser *modificado* por otro usuario (`GET /admin/usuarios/:userId/permisos`). Consecuencia real: `tieneModuloActivo` (fail-closed, REQ-X1/X2) resolvía `false` para todo, y el menú de `AppLayout` (SPEC-008) quedaba reducido a un solo ítem para ese rol — un bug funcional, no cosmético. Se solicitó formalmente vía `frontend-a-backend/PETICION-003-datos-usuario-y-logo-empresa.md` (punto 3, ampliado el mismo día). Backend respondió (`api-pos/backend-a-frontend/RESPUESTA-003-datos-usuario-y-logo-empresa.md`) agregando `accesoTotal: boolean` a `PermisosEfectivosUsuario` — `true` solo para `superadmin`, con `modulos: []` en ese caso (nunca poblado con el catálogo completo, a propósito). Ver REQ-U10.

## Requisitos en formato EARS

### Ubiquitous (siempre aplica)

- **REQ-U1** _(resuelto por backend, 2026-07-29)_: El backend expone `GET /auth/permisos`, protegido únicamente con `verificarToken` + `verificarSuscripcion` (sin `verificarRole`), que resuelve los permisos efectivos del propio usuario autenticado a partir del `userId` del token — el endpoint no acepta `userId` como parámetro bajo ninguna forma — devolviendo `PermisosEfectivosUsuario`. Ref: `api-pos/backend-a-frontend/RESPUESTA-001-permisos-self-service.md`, `api-pos/src/routes/v1/auth.routes.ts` (`GET /permisos`), `api-pos/src/controllers/auth.controller.ts` (`getMisPermisos`).
- **REQ-U2**: El sistema DEBE exponer un hook `usePermisos()` en `features/auth/hooks/` que consulte el endpoint de REQ-U1 vía TanStack Query (`useQuery`), con `queryKey` que incluya el `usuarioId` de la sesión activa. Es dato de servidor — nunca se duplica en Zustand (CLAUDE.md §3).
- **REQ-U3**: A partir del resultado de `usePermisos()`, el sistema DEBE derivar funciones puras de consulta — `tieneModuloActivo(clave)` y `tieneAccion(clave)` — calculadas en cada uso, sin persistir ese resultado derivado en ningún store (CLAUDE.md §9, nunca guardar estado derivable).
- **REQ-U4**: El sistema DEBE crear un guard `app/RequirePermission`, análogo a `RequireAuth`/`RequireOnboarding`, que reciba la clave de módulo requerida (`modulo.<clave>`) y bloquee el render del `Outlet` si `tieneModuloActivo` (REQ-U3) es `false`.
- **REQ-U5**: El sistema DEBE combinar `RequirePermission` (REQ-U4) con el lazy-loading de rutas (SPEC-006 REQ-U1), de forma que el `import()` del chunk de una feature protegida solo se dispare cuando el usuario ya superó el guard — logrado de forma natural si `RequirePermission` envuelve la ruta y renderiza `<Navigate>` en vez de `<Outlet>` cuando el permiso es negativo, porque el componente lazy hijo nunca llega a montarse.
- **REQ-U6** _(implementado, SPEC-008)_: El menú de navegación de `AppLayout` DEBE ocultar cualquier entrada cuyo módulo no esté activo para el usuario según `tieneModuloActivo` (o mostrarlas todas si `tieneAccesoTotal`, REQ-U10) — no basta con bloquear la ruta; la entrada tampoco debe ser visible ni enfocable por teclado. Implementado en `layouts/AppLayout/TenantChrome.tsx` (SPEC-008 REQ-U10/U12).
- **REQ-U7** _(resuelto por backend, 2026-08-03)_: `LoginTenantResponse` (`api-pos/src/interfaces/auth.interfaces.ts`) incluye **`usuarioId` y `empresaId`** explícitos, requeridos (no opcionales) cuando `perfilCompleto: true`. Ref: `api-pos/backend-a-frontend/RESPUESTA-002-contexto-tenant-login.md`, `frontend-a-backend/PETICION-002-contexto-tenant-login.md`. `LoginSysAdminResponse` no se modificó (sysadmin usa `verificarSysAdmin`, no exige estos headers) ni `PerfilCompletoResponse` (ya traía `empresaId` desde SPEC-004; no incluye `usuarioId` porque no cambia respecto al login inicial).
- **REQ-U8** _(implementado)_: `session.store` persiste `usuarioId` y `empresaId` en la rama tenant — únicamente in-memory, mismo tratamiento que `accessToken` (nunca en `sessionStorage`, ver SPEC-005 REQ-U1): viajan siempre junto al `accessToken` para armar `x-usuario-id`/`x-empresa-id`. `setTenantSession` acepta ambos como parámetros obligatorios. `usuarioId` es un campo compartido con la rama onboarding (que sí lo persiste); `partialize` lo excluye del storage cuando `onboardingToken` es `null` (rama tenant), para no romper ese comportamiento con un solo campo compartido. `LoginSysAdminResponse` no trae `usuarioId`/`empresaId` (REQ-U7): se agregó una acción propia, `setSysAdminSession`, en vez de reusar `setTenantSession` con esos campos opcionales (habría contradicho "obligatorios" de este REQ). `useCompletarPerfil` conserva el `usuarioId` que ya existe en el store desde la sesión de onboarding (invariante garantizado por `RequireOnboarding`) y toma `empresaId` de `PerfilCompletoResponse`. Ref: `src/stores/session.store.ts`, `src/features/auth/hooks/useLogin.ts`, `src/features/auth/hooks/useCompletarPerfil.ts`.
- **REQ-U9** _(implementado)_: El request interceptor de `services/apiClient.ts` adjunta `x-usuario-id` y `x-empresa-id` en la rama `accessToken` cuando existen en el store. Condicionar a que existan (no asumirlos siempre presentes) cubre también la sesión de sysadmin, que comparte el campo `accessToken` pero nunca tiene `usuarioId`/`empresaId`. Ref: `src/services/apiClient.ts`.
- **REQ-U10** _(resuelto por backend e implementado, 2026-08-03)_: `PermisosEfectivosUsuario` incluye `accesoTotal: boolean` explícito (`true` únicamente para `superadmin`; `modulos` siempre `[]` cuando lo es). El sistema DEBE exponer una función pura `tieneAccesoTotal(data)` (mismo criterio que REQ-U3) y consultarla **antes** de `tieneModuloActivo` en todo punto que resuelva autorización — `RequirePermission` (REQ-U4) y el filtro de menú de `AppLayout` (REQ-U6): si `tieneAccesoTotal` es `true`, el chequeo por módulo se salta por completo, nunca se evalúa contra `modulos` (que vendría vacío). Ref: `api-pos/backend-a-frontend/RESPUESTA-003-datos-usuario-y-logo-empresa.md`, `frontend-a-backend/PETICION-003-datos-usuario-y-logo-empresa.md`.

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

| REQ | Test |
| --- | --- |
| U2/U3 | `src/features/auth/hooks/usePermisos.test.ts` — `tieneModuloActivo`/`tieneAccion` |
| U3 (fail-closed) | `usePermisos.test.ts` — casos `modulos` `undefined` |
| U4 | `src/app/RequirePermission.test.tsx` — "renderiza el Outlet cuando el módulo está activo" |
| U5 | `RequirePermission.test.tsx` — el redirect nunca renderiza el `Outlet`/ruta hija (mecanismo por construcción: `Navigate` en vez de `Outlet`) |
| U7 | `src/features/auth/hooks/useLogin.test.tsx`, `src/stores/session.store.test.ts` |
| U8 | `session.store.test.ts` (`setTenantSession`, `setSysAdminSession`, `setOnboardingSession`, `partialize`), `useCompletarPerfil.test.tsx` |
| U9 | `src/services/apiClient.test.ts` — "adjunta x-usuario-id/x-empresa-id..." / "no adjunta... sysadmin" |
| S1 | `RequirePermission.test.tsx` — "muestra un skeleton mientras usePermisos() está cargando" |
| S2/E1 | `apiClient.test.ts` — "ante ERR_PERMISSION_DENIED (403)... invalida la query de permisos" |
| E2 | `RequirePermission.test.tsx` — "redirige a /no-autorizado (no a /login)..." |
| X1 | `RequirePermission.test.tsx` — "fail-closed: ante un error inesperado..."; `usePermisos.test.ts` |
| X2 | Cubierto por `app/queryClient.ts` (`QueryCache.onError` global, CLAUDE.md §8) — sin test dedicado por REQ, ver §Riesgo documentado (adenda v1.2.0) |
| U6 | `test/layouts/AppLayout/TenantChrome.test.tsx` (SPEC-008) — "solo muestra en el menú los módulos activos...", "con accesoTotal: true, muestra todos los módulos..." |
| U10 | `test/features/auth/usePermisos.test.ts` — `describe('tieneAccesoTotal')`; `RequirePermission.test.tsx` — "con accesoTotal: true, renderiza el Outlet aunque el módulo no esté en `modulos`..."; `TenantChrome.test.tsx` — mismo caso a nivel de menú |

**Riesgo documentado (adenda v1.2.0, resuelta en v1.3.0)**: REQ-U6 (ocultar entradas de menú) ya no está fuera de alcance — `AppLayout` existe (SPEC-008) y lo implementa (`TenantChrome.tsx`). REQ-U5 se verificó end-to-end contra una ruta de feature real (`test/app/router.test.tsx`, `/ventas` con `RequirePermission`) al wire-earse SPEC-008.

## Auditoría

> Ref: **api-pos SPEC-003** (`auth-permisos.spec.md`) / **api-pos SPEC-008** (`auditoria.spec.md`)

Sin eventos de auditoría propios del front. Todo cambio de permiso (`PERM_ROLE_MODULE_UPDATED`, `PERM_ROLE_ACTION_UPDATED`, `PERM_ROLE_RESET`, `PERM_USER_MODULE_OVERRIDE`, `PERM_USER_ACTION_OVERRIDE`, `PERM_USER_RESET` — `api-pos/src/constants/audit.constants.ts`) ya se audita en backend cuando un `superadmin` lo ejecuta desde el panel de gestión; eso queda fuera de alcance de esta spec, que solo cubre el consumo de solo-lectura desde el front. El endpoint self-service propuesto en REQ-U1 es `GET` y no requiere una constante nueva en `AUDIT_ACTIONS`.

## Dependencias

- **Resuelto** (backend): endpoint de REQ-U1 — `GET /auth/permisos`, ver `api-pos/backend-a-frontend/RESPUESTA-001-permisos-self-service.md`. Ya no bloquea.
- **Resuelto** (backend): REQ-U7 — `usuarioId`/`empresaId` explícitos en `LoginTenantResponse`, ver `api-pos/backend-a-frontend/RESPUESTA-002-contexto-tenant-login.md`. REQ-U8/U9 implementados y verificados contra este contrato. Ya no bloquea.
- **Resuelto** (backend): REQ-U10 — `accesoTotal: boolean` en `PermisosEfectivosUsuario`, ver `api-pos/backend-a-frontend/RESPUESTA-003-datos-usuario-y-logo-empresa.md`. Implementado en `usePermisos.ts` (`tieneAccesoTotal`), `RequirePermission.tsx` y `TenantChrome.tsx` (SPEC-008). Ya no bloquea.
- **Depende de**: SPEC-008 (`AppLayout`) — consumidor real de REQ-U6/U10; sus tests (`test/layouts/AppLayout/TenantChrome.test.tsx`) validan ambos end-to-end a nivel de menú.
- **Depende de** (backend, contrato): `interfaces/permisos.interfaces.ts` (`PermisosEfectivosUsuario`, `ModuloEfectivo`, `AccionEfectiva`), `constants/permisos.constants.ts` (`PERMISOS_ERRORS.PERMISSION_DENIED` = `ERR_PERMISSION_DENIED`), `constants/auth.constants.ts` (`ROLES_CATALOGO`), `middlewares/verificarToken.middleware.ts` (contrato de headers `x-usuario-id`/`x-empresa-id` obligatorios en rama tenant, motivo de REQ-U7/U8/U9).
- **Depende de**: SPEC-005 (Sesión Tenant) — REQ-U8 de esta spec sigue el mismo tratamiento de privilegio in-memory que SPEC-005 REQ-U1/U3 definió para `accessToken`.
- **Depende de**: SPEC-006 (Code Splitting) — REQ-U5 de esta spec combina ambos contratos.
- **Depende de**: SPEC-002 (Login) y SPEC-004 (Completar Perfil) — dueñas de `setTenantSession`/`LoginTenantResponse` y `PerfilCompletoResponse` respectivamente, que REQ-U7/U8 extienden.
- **Bloquea**: toda feature de dominio (ventas, inventario, productos, almacenes, clientes, admin) que deba ocultar o bloquear UI según rol/permiso, y también cualquier feature que simplemente necesite hacer una petición tenant autenticada — ninguna debe implementar su propio manejo de `x-empresa-id` ad-hoc; todas dependen de REQ-U9 (interceptor).
- **Riesgo documentado**: ver adenda v1.2.0 en §Tests trazados — REQ-U6 fuera de alcance (contrato de `AppLayout`, no existe aún) y REQ-U5 sin verificación end-to-end contra una feature real todavía.

## Cambios

- v1.3.0 (2026-08-03): Corregido bug real encontrado en producción — `GET /auth/permisos` respondía `403 ERR_SUPERADMIN_PROTECTED` para `superadmin`, dejando el menú de `AppLayout` reducido a un solo ítem para ese rol (fail-closed sobre un error que en realidad significaba "acceso total"). Backend agregó `accesoTotal: boolean` al contrato (`RESPUESTA-003-datos-usuario-y-logo-empresa.md`, responde a `PETICION-003` punto 3). Se agrega REQ-U10 (`tieneAccesoTotal`, consultado antes que `tieneModuloActivo` en `RequirePermission` y en el menú de `AppLayout`). REQ-U6 pasa de "fuera de alcance" a "implementado" — `AppLayout` (SPEC-008) ya existe y lo implementa; REQ-U5 queda verificado end-to-end contra una ruta de feature real (`/ventas`).
- v1.2.0 (2026-08-03): Backend respondió `PETICION-002` — `usuarioId`/`empresaId` explícitos en `LoginTenantResponse` (REQ-U7 actualizado de "bloqueante" a "resuelto"). Implementados REQ-U2 a REQ-U9, REQ-S1/S2, REQ-E1/E2 y REQ-X1/X2 contra el contrato real: `session.store` (`empresaId` nuevo, `setTenantSession`/`setSysAdminSession`), interceptor de `apiClient.ts` (headers tenant + invalidación en 403), `usePermisos`/`tieneModuloActivo`/`tieneAccion`, guard `RequirePermission`, ruta `/no-autorizado`, y manejo de error global en `queryClient.ts` (`QueryCache.onError`). Estado pasa de `draft` a `active` — todos los REQ tienen test trazado (ver §Tests trazados). REQ-U6 permanece fuera de alcance de implementación (contrato para `AppLayout`, todavía no existe como feature).
- v1.1.0 (2026-07-29): Backend respondió `PETICION-001` — `GET /auth/permisos` implementado y disponible (REQ-U1 actualizado de "bloqueante" a "resuelto"). Al verificar el contrato de headers de la respuesta contra `verificarToken.middleware.ts`, se encontró un gap nuevo y más amplio: el frontend no tiene forma de armar `x-usuario-id`/`x-empresa-id` en ninguna petición tenant (interceptor incompleto + `session.store` sin `empresaId` + `LoginTenantResponse` sin `usuarioId` ni `empresaId`). Se agregan REQ-U7 (bloqueante, backend — pedido en `PETICION-002`), REQ-U8 (`session.store`) y REQ-U9 (interceptor) para resolverlo dentro de esta spec, por ser el primer consumidor real de una ruta tenant con datos (mismo criterio que SPEC-004 REQ-U10).
- v1.0.0 (2026-07-29): Versión inicial (`draft`). Documenta el modelo de autorización del backend, el contrato de datos a reutilizar, y el gap bloqueante encontrado (no existe endpoint self-service de permisos).
