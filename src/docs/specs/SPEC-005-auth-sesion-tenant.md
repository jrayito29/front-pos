# SPEC-005: Persistencia y Refresh Silencioso de Sesión de Tenant

## Metadata

- **ID**: SPEC-005
- **Dominio**: auth
- **Versión**: 1.2.0
- **Estado**: active
- **Owner**: `Equipo Frontend POS-MX`
- **Creada**: 2026-07-29
- **Última revisión**: 2026-08-04

## Contexto

SPEC-004 (REQ-U11) documentó una decisión deliberada: `session.store` persiste en `sessionStorage` **únicamente** el subconjunto `{ onboardingToken, usuarioId }`; `accessToken`/`refreshToken` de sesión de tenant quedan explícitamente fuera de `partialize` y viven solo en memoria, por ser de mayor privilegio que el `onboardingToken` (rol `PENDING_OWNER`, sin `empresaId`). El efecto colateral no evaluado en esa spec: cualquier reload (F5) mientras el usuario opera con sesión de tenant completa (dashboard, panel sysadmin) destruye el `accessToken` en memoria, y `RequireAuth` (`app/RequireAuth.tsx`) redirige a `/login` de inmediato — el usuario debe reautenticarse aunque su `refreshToken` siga vigente en el backend. En un sistema POS de uso continuo durante el turno de un cajero, esto es una regresión de UX seria, no un detalle menor.

Esta spec corrige el problema sin relajar la razón original de REQ-U11: el `accessToken` de alto privilegio **sigue sin tocar `sessionStorage`**. Lo que cambia es que el `refreshToken` (de vida más larga, y ya usado hoy para la rama de recuperación de onboarding, ver `services/apiClient.ts`) se persiste, y se usa para obtener un `accessToken` nuevo de forma transparente al arrancar la app — mismo patrón que SPEC-004 REQ-U11/S5, aplicado a la rama de tenant.

**Hallazgo adicional durante el análisis**: `refreshToken` es un único campo del store, compartido entre la rama onboarding y la rama tenant (`setOnboardingSession`/`setTenantSession` escriben el mismo slice). Hoy **ninguna** de las dos ramas lo persiste — el `partialize` actual de SPEC-004 solo incluye `{ onboardingToken, usuarioId }`. Esto significa que el gap no es exclusivo de tenant: si el `onboardingToken` rehidratado tras un reload ya expiró, el intento de refresh de SPEC-004 REQ-X2 también falla hoy por falta de `refreshToken` en memoria. Al incluir `refreshToken` en `partialize` (REQ-U1), esta spec corrige ambas ramas con un solo cambio, por compartir el mismo campo.

**Contrato de backend original (v1.1.0), ya no vigente**: al escribir esta spec, `POST /auth/refresh` respondía `RefreshTenantResponse { accessToken }` — sin `usuarioId`/`empresaId` — cuando el `refreshToken` enviado pertenecía a una sesión de tenant, y la rama `sysadmin` no existía como caso explícito (un refresh de un usuario `sysadmin` caía en la misma rama tenant, con un cast forzado del lado del backend). Esta spec se escribió entonces como "100% frontend, sin cambios requeridos en backend".

**Gap encontrado en producción (2026-08-03) y resuelto por backend**: como `setAccessToken` (REQ-U3 original) solo actualizaba `accessToken`, una sesión tenant que sobrevivía a un reload vía el silent-refresh de esta spec (REQ-U5) quedaba con `usuarioId`/`empresaId` en `null` de forma permanente — sin forma de reconstruir `x-usuario-id`/`x-empresa-id` (SPEC-007 REQ-U9) para ninguna petición tenant posterior, y con `AppLayout` (SPEC-008) interpretando la ausencia de `empresaId` como "sesión sysadmin", mostrando el panel equivocado. Se solicitó formalmente vía `frontend-a-backend/PETICION-004-usuarioid-empresaid-en-refresh-tenant.md`. Backend respondió (`api-pos/backend-a-frontend/RESPUESTA-004-usuarioid-empresaid-en-refresh-tenant.md`, SPEC-001 backend REQ-U19/U20) con dos cambios en el mismo contrato:

1. `RefreshTenantResponse` ahora incluye `usuarioId: string` y `empresaId: string`, ambos **requeridos** (no opcionales) — mismo criterio ya aplicado a `LoginTenantResponse` (SPEC-007 REQ-U7).
2. Se agregó una rama `sysadmin` explícita (antes inexistente): cuando la sesión renovada es `sysadmin`, la respuesta es `RefreshSysAdminResponse { accessToken }` únicamente — mismo contrato que `LoginSysAdminResponse` — y el JWT resultante ya no arrastra un `empresaId`/`suscripcionStatus` inventados.

El discriminador entre ambas ramas es el mismo que ya usa el frontend en login (SPEC-002/SPEC-007 REQ-U7): presencia de `usuarioId`/`empresaId` ⇒ sesión tenant; ausencia ⇒ sesión sysadmin. Esta spec se actualiza (v1.2.0) para que `session.store`/`apiClient.ts` consuman el contrato real en vez del original documentado en v1.1.0.

## Requisitos en formato EARS

### Ubiquitous (siempre aplica)

- **REQ-U1**: `session.store` DEBE incluir `refreshToken` en el subconjunto persistido por `partialize` (junto a `onboardingToken`/`usuarioId`, ver SPEC-004 REQ-U11), de forma que sobreviva a un reload tanto en sesión de onboarding como en sesión de tenant. `accessToken` NUNCA se agrega a `partialize` — permanece exclusivamente in-memory.
- **REQ-U2**: El sistema DEBE extender el interceptor de response de `services/apiClient.ts` para manejar refresh transparente de sesión de **tenant o sysadmin** (ambas comparten el campo `accessToken`, ver SPEC-007 REQ-U9): ante `ERR_TOKEN_EXPIRED`/`ERR_TOKEN_INVALID` (401) en una petición autenticada con `accessToken` (rama hoy excluida de `canRetryOnboarding`), intentar `POST /auth/refresh` con el `refreshToken` vigente y, si resuelve, actualizar `session.store` según la rama de la respuesta (REQ-E3/E4) y reintentar la petición original una única vez (mismo criterio de `_retried` que la rama onboarding, en un flag separado para no colisionar con `_onboardingRetried`).
- **REQ-U3**: `session.store` DEBE exponer una acción distinta de `setTenantSession` para aplicar el resultado de un refresh silencioso, que actualice `accessToken` y, cuando la respuesta los incluya (rama tenant, REQ-E3), también `usuarioId`/`empresaId` — sin resetear `mustChangePassword`/`requiereSeleccionSucursal` ni limpiar `onboardingToken`. `setTenantSession` no debe usarse para un refresh silencioso porque reinicia esos campos a sus valores por defecto.
- **REQ-U6**: El sistema DEBE discriminar la rama de la respuesta de `POST /auth/refresh` por presencia de `usuarioId`/`empresaId` en `data.data` — mismo discriminador que ya usa `useLogin` para `LoginResponse` (SPEC-002/SPEC-007 REQ-U7) — tanto en el silent-refresh de bootstrap (REQ-U5) como en el reintento del interceptor (REQ-U2), para no aplicar la rama equivocada de REQ-E3/E4.
- **REQ-U4**: `app/RequireAuth.tsx` DEBE esperar la rehidratación de `persist` (mismo mecanismo `useSessionHydrated` ya implementado en `app/RequireOnboarding.tsx`, extraíble a un hook compartido) antes de evaluar `!accessToken`, para no expulsar a `/login` en el primer render de un reload mientras la rehidratación de `refreshToken` está en curso.
- **REQ-U5**: El sistema DEBE disparar un intento de "silent refresh" en el bootstrap de la app: tras confirmar la rehidratación (REQ-U4), si existe `refreshToken` en el store pero no `accessToken` en memoria, DEBE invocar `POST /auth/refresh` para obtener un `accessToken` nuevo antes de decidir si renderiza el `Outlet` o redirige a `/login`.

### State-driven (mientras X)

- **REQ-S1**: Mientras el silent-refresh de bootstrap (REQ-U5) esté en curso, `RequireAuth` DEBE mostrar un estado de carga (skeleton acorde al layout de destino, nunca un spinner genérico — CLAUDE.md §8) en vez de redirigir a `/login` o renderizar el `Outlet` prematuramente.

### Event-driven (cuando X)

- **REQ-E1**: Cuando el silent-refresh de bootstrap (REQ-U5) resuelva con éxito, el sistema DEBE persistir el resultado vía la acción de REQ-U3 (aplicando la rama que corresponda según REQ-E3/E4) y renderizar el `Outlet` de la ruta protegida solicitada originalmente.
- **REQ-E2**: Cuando el interceptor de response (REQ-U2) detecte un 401 con `accessToken` activo y el refresh resuelva con éxito, DEBE actualizar `session.store` vía la acción de REQ-U3 (aplicando la rama que corresponda según REQ-E3/E4) y reintentar la petición original una única vez.
- **REQ-E3**: Cuando la respuesta de `POST /auth/refresh` (disparada por REQ-U2 o REQ-U5) incluya `usuarioId`/`empresaId` (REQ-U6), el sistema DEBE tratarla como renovación de sesión **tenant** y actualizar `accessToken`, `usuarioId` y `empresaId` en `session.store` — permite reconstruir `x-usuario-id`/`x-empresa-id` (SPEC-007 REQ-U9) tras un reload sin decodificar el JWT (CLAUDE.md §6), y resuelve el bug de `AppLayout` (SPEC-008) mostrando el panel de sysadmin a una sesión tenant recargada.
- **REQ-E4**: Cuando la respuesta de `POST /auth/refresh` no incluya `usuarioId`/`empresaId` (REQ-U6), el sistema DEBE tratarla como renovación de sesión **sysadmin** y actualizar únicamente `accessToken`, sin modificar `usuarioId`/`empresaId` (permanecen `null`, mismo criterio que `setSysAdminSession`, SPEC-007 REQ-U8).

### Unwanted (si X entonces)

- **REQ-X1**: Si el silent-refresh de bootstrap (REQ-U5) falla (`ERR_INVALID_REFRESH_TOKEN`, error de red, o cualquier error del endpoint), el sistema DEBE limpiar la sesión (`clearSession`) y redirigir a `/login` **sin** mostrar un toast de error — a diferencia de REQ-X2 de SPEC-004, este fallo no es resultado de una acción explícita del usuario (puede ocurrir simplemente porque pasaron varios días desde el último login), y un toast espontáneo apenas se abre la app es ruido, no información útil.
- **REQ-X2**: Si el refresh disparado por el interceptor de reintento (REQ-U2/E2) también falla, el sistema DEBE limpiar la sesión, mostrar un toast indicando que la sesión expiró, y redirigir a `/login` — aquí sí aplica el mismo patrón que SPEC-004 REQ-X2, porque el fallo interrumpe una acción en curso del usuario.
- **REQ-X3**: Si múltiples peticiones en paralelo fallan por 401 simultáneamente (bootstrap o interceptor), el sistema NO DEBE disparar más de una llamada concurrente a `POST /auth/refresh` — las peticiones que lleguen mientras un refresh ya está en curso DEBEN esperar la misma promesa (dedupe) en vez de disparar una nueva, para evitar condiciones de carrera y invalidaciones dobles de `refreshToken`.

## Criterios de aceptación

Cada REQ de arriba DEBE tener al menos un test que:

1. Lo referencia por ID exacto en un comentario: `// spec:SPEC-005:REQ-<X>`
2. Falla si el requisito no se cumple
3. Se ejecuta en `npm test` sin configuración adicional

## Tests trazados

Suite: Vitest + Testing Library (`npm test` → `vitest run`).

| REQ | Archivo |
| --- | --- |
| U1  | `test/stores/session.store.test.ts` |
| U2  | `test/services/apiClient.test.ts` |
| U3  | `test/stores/session.store.test.ts` |
| U4  | `test/app/RequireAuth.test.tsx` |
| U5  | `test/app/RequireAuth.test.tsx` |
| U6  | `test/services/apiClient.test.ts` |
| S1  | `test/app/RequireAuth.test.tsx` |
| E1  | `test/app/RequireAuth.test.tsx` |
| E2  | `test/services/apiClient.test.ts` |
| E3  | `test/services/apiClient.test.ts`, `test/stores/session.store.test.ts` |
| E4  | `test/services/apiClient.test.ts`, `test/stores/session.store.test.ts` |
| X1  | `test/app/RequireAuth.test.tsx` |
| X2  | `test/services/apiClient.test.ts` |
| X3  | `test/services/apiClient.test.ts` |

## Auditoría

> Ref: **api-pos SPEC-008** (`auditoria.spec.md`)

Sin eventos de auditoría nuevos. `POST /auth/refresh` ya está auditado en backend (`AUDIT_ACTIONS.AUTH_REFRESH_TOKEN`, `api-pos/src/routes/v1/auth.routes.ts`) — esta spec reutiliza ese evento existente tanto para el silent-refresh de bootstrap (REQ-U5) como para el reintento del interceptor (REQ-U2), sin distinguir el origen de la llamada en el evento auditado.

## Dependencias

- **Depende de**: SPEC-002 (Login) — dueña de `setTenantSession` y del contrato `LoginTenantResponse`/`LoginSysAdminResponse` que originan la sesión que esta spec ahora persiste parcialmente.
- **Depende de**: SPEC-004 (Completar Perfil) — REQ-U11/S5 son el patrón de `partialize` + guard de hidratación que esta spec extiende de onboarding a tenant; REQ-X2 es el precedente del interceptor de refresh transparente que esta spec replica para la rama de `accessToken`.
- **Depende de**: SPEC-007 (Permisos) — REQ-U7 define el mismo discriminador (`usuarioId`/`empresaId` presentes ⇒ tenant) que REQ-U6 de esta spec replica para `POST /auth/refresh`; REQ-U8/U9 son los consumidores de `usuarioId`/`empresaId` que REQ-E3 vuelve a poblar tras un reload.
- **Depende de** (backend, `api-pos/src/`): `interfaces/auth.interfaces.ts` (`RefreshTenantResponse`, `RefreshSysAdminResponse`), `routes/v1/auth.routes.ts` (`POST /auth/refresh`) — contrato ampliado en `RESPUESTA-004-usuarioid-empresaid-en-refresh-tenant.md`, sin cambios adicionales pendientes en backend para esta spec.
- **Bloquea**: toda vista protegida por `RequireAuth` (dashboard, panel sysadmin, y cualquier feature de dominio futura) — todas heredan este comportamiento por vivir bajo el mismo guard. Antes de v1.2.0, bloqueaba en la práctica cualquier feature tenant real tras un reload (401 `ERR_MISSING_CONTEXT` por falta de headers, ver PETICION-004 §Impacto).
- **Riesgo documentado**: al ampliar `partialize` para incluir `refreshToken` sin condicionarlo por rama, se corrige de paso el gap preexistente de la rama onboarding (ver §Contexto) — requiere un test de regresión que confirme que SPEC-004 REQ-X2 sigue funcionando igual (o mejor) tras este cambio, no solo que SPEC-005 pasa en aislamiento.
- **Resuelto** (backend): REQ-U6/E3/E4 — `usuarioId`/`empresaId` requeridos en `RefreshTenantResponse` y rama `RefreshSysAdminResponse` explícita, ver `api-pos/backend-a-frontend/RESPUESTA-004-usuarioid-empresaid-en-refresh-tenant.md`. Ya no bloquea.

## Cambios

- v1.2.0 (2026-08-04): Backend respondió `PETICION-004` (`RESPUESTA-004-usuarioid-empresaid-en-refresh-tenant.md`) — `RefreshTenantResponse` ahora incluye `usuarioId`/`empresaId` requeridos y se agrega `RefreshSysAdminResponse { accessToken }` como rama explícita. Se agregan REQ-U6 (discriminador de rama) y REQ-E3/E4 (aplicación de cada rama en `session.store`); REQ-U2/U3/E1/E2 se actualizan para dejar de describir el contrato viejo (`RefreshTenantResponse` sin esos campos). Resuelve, del lado del backend, el bug de `AppLayout` (SPEC-008) mostrando el panel de sysadmin a una sesión tenant tras un reload. Archivos modificados: `features/auth/types/auth.types.ts` (`RefreshTenantResponse`/`RefreshSysAdminResponse`, nuevos), `stores/session.store.ts` (`setAccessToken` acepta ahora `{ accessToken, usuarioId?, empresaId? }`), `services/apiClient.ts` (`refreshTenantAccessToken` discrimina la rama de la respuesta). Tests: `test/stores/session.store.test.ts` (2 nuevos, 1 actualizado a la nueva firma), `test/services/apiClient.test.ts` (1 nuevo para la rama sysadmin, 2 actualizados al contrato tenant real). 123/123 tests pasan; `tsc --noEmit` y `eslint .` limpios.
- v1.1.0 (2026-07-29): Implementación completa, pasa a `active`. Archivos nuevos/modificados: `stores/session.store.ts` (acción `setAccessToken`, `partialize` extendido con `refreshToken`), `services/apiClient.ts` (`refreshTenantAccessToken` con dedupe module-level, rama tenant del interceptor de response, `TOKEN_REFRESH_ERROR_CODES` renombrado desde `ONBOARDING_TOKEN_ERROR_CODES`), `app/RequireAuth.tsx` (reescrito: hook `useTenantAuthStatus`, gate de hidratación, silent-refresh de bootstrap, `AuthCheckingSkeleton`), `app/useSessionHydrated.ts` (nuevo — extraído de `RequireOnboarding.tsx`, ahora compartido entre ambos guards), `components/Skeleton/` (nuevo, documentado primero en SPEC-001 por regla obligatoria de esa spec). Tests: `session.store.test.ts` (el test que afirmaba `refreshToken` in-memory en rama tenant se corrigió — ya no es cierto tras REQ-U1), `apiClient.test.ts` (3 tests nuevos), `RequireAuth.test.tsx` (nuevo archivo, 5 tests). 50/50 tests pasan, `tsc --noEmit` y `eslint .` limpios.
- v1.0.0 (2026-07-29): Versión inicial (`draft`). Documenta el gap de UX (reload en dashboard fuerza re-login) y el gap preexistente relacionado en la rama onboarding, ambos originados por el mismo campo `refreshToken` no persistido.
