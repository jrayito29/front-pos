# SPEC-005: Persistencia y Refresh Silencioso de Sesión de Tenant

## Metadata

- **ID**: SPEC-005
- **Dominio**: auth
- **Versión**: 1.1.0
- **Estado**: active
- **Owner**: `Equipo Frontend POS-MX`
- **Creada**: 2026-07-29
- **Última revisión**: 2026-07-29

## Contexto

SPEC-004 (REQ-U11) documentó una decisión deliberada: `session.store` persiste en `sessionStorage` **únicamente** el subconjunto `{ onboardingToken, usuarioId }`; `accessToken`/`refreshToken` de sesión de tenant quedan explícitamente fuera de `partialize` y viven solo en memoria, por ser de mayor privilegio que el `onboardingToken` (rol `PENDING_OWNER`, sin `empresaId`). El efecto colateral no evaluado en esa spec: cualquier reload (F5) mientras el usuario opera con sesión de tenant completa (dashboard, panel sysadmin) destruye el `accessToken` en memoria, y `RequireAuth` (`app/RequireAuth.tsx`) redirige a `/login` de inmediato — el usuario debe reautenticarse aunque su `refreshToken` siga vigente en el backend. En un sistema POS de uso continuo durante el turno de un cajero, esto es una regresión de UX seria, no un detalle menor.

Esta spec corrige el problema sin relajar la razón original de REQ-U11: el `accessToken` de alto privilegio **sigue sin tocar `sessionStorage`**. Lo que cambia es que el `refreshToken` (de vida más larga, y ya usado hoy para la rama de recuperación de onboarding, ver `services/apiClient.ts`) se persiste, y se usa para obtener un `accessToken` nuevo de forma transparente al arrancar la app — mismo patrón que SPEC-004 REQ-U11/S5, aplicado a la rama de tenant.

**Hallazgo adicional durante el análisis**: `refreshToken` es un único campo del store, compartido entre la rama onboarding y la rama tenant (`setOnboardingSession`/`setTenantSession` escriben el mismo slice). Hoy **ninguna** de las dos ramas lo persiste — el `partialize` actual de SPEC-004 solo incluye `{ onboardingToken, usuarioId }`. Esto significa que el gap no es exclusivo de tenant: si el `onboardingToken` rehidratado tras un reload ya expiró, el intento de refresh de SPEC-004 REQ-X2 también falla hoy por falta de `refreshToken` en memoria. Al incluir `refreshToken` en `partialize` (REQ-U1), esta spec corrige ambas ramas con un solo cambio, por compartir el mismo campo.

**Contrato de backend ya disponible, sin cambios requeridos**: `POST /auth/refresh` ya responde `RefreshTenantResponse { accessToken }` cuando el `refreshToken` enviado pertenece a una sesión de tenant (`api-pos/src/interfaces/auth.interfaces.ts`), y la ruta ya está auditada (`AUDIT_ACTIONS.AUTH_REFRESH_TOKEN`, `api-pos/src/routes/v1/auth.routes.ts`). Esta spec es 100% frontend.

## Requisitos en formato EARS

### Ubiquitous (siempre aplica)

- **REQ-U1**: `session.store` DEBE incluir `refreshToken` en el subconjunto persistido por `partialize` (junto a `onboardingToken`/`usuarioId`, ver SPEC-004 REQ-U11), de forma que sobreviva a un reload tanto en sesión de onboarding como en sesión de tenant. `accessToken` NUNCA se agrega a `partialize` — permanece exclusivamente in-memory.
- **REQ-U2**: El sistema DEBE extender el interceptor de response de `services/apiClient.ts` para manejar refresh transparente de sesión de **tenant**: ante `ERR_TOKEN_EXPIRED`/`ERR_TOKEN_INVALID` (401) en una petición autenticada con `accessToken` (rama hoy excluida de `canRetryOnboarding`), intentar `POST /auth/refresh` con el `refreshToken` vigente y, si resuelve, actualizar el `accessToken` en `session.store` y reintentar la petición original una única vez (mismo criterio de `_retried` que la rama onboarding, en un flag separado para no colisionar con `_onboardingRetried`).
- **REQ-U3**: `session.store` DEBE exponer una acción `setAccessToken(accessToken)` distinta de `setTenantSession`, que actualice únicamente el `accessToken` sin resetear `mustChangePassword`/`requiereSeleccionSucursal` ni limpiar `onboardingToken`/`usuarioId` — `RefreshTenantResponse` no trae esos campos, y `setTenantSession` no debe usarse para un refresh silencioso porque los reinicia a sus valores por defecto.
- **REQ-U4**: `app/RequireAuth.tsx` DEBE esperar la rehidratación de `persist` (mismo mecanismo `useSessionHydrated` ya implementado en `app/RequireOnboarding.tsx`, extraíble a un hook compartido) antes de evaluar `!accessToken`, para no expulsar a `/login` en el primer render de un reload mientras la rehidratación de `refreshToken` está en curso.
- **REQ-U5**: El sistema DEBE disparar un intento de "silent refresh" en el bootstrap de la app: tras confirmar la rehidratación (REQ-U4), si existe `refreshToken` en el store pero no `accessToken` en memoria, DEBE invocar `POST /auth/refresh` para obtener un `accessToken` nuevo antes de decidir si renderiza el `Outlet` o redirige a `/login`.

### State-driven (mientras X)

- **REQ-S1**: Mientras el silent-refresh de bootstrap (REQ-U5) esté en curso, `RequireAuth` DEBE mostrar un estado de carga (skeleton acorde al layout de destino, nunca un spinner genérico — CLAUDE.md §8) en vez de redirigir a `/login` o renderizar el `Outlet` prematuramente.

### Event-driven (cuando X)

- **REQ-E1**: Cuando el silent-refresh de bootstrap (REQ-U5) resuelva con éxito, el sistema DEBE persistir el `accessToken` recibido vía `setAccessToken` (REQ-U3) y renderizar el `Outlet` de la ruta protegida solicitada originalmente.
- **REQ-E2**: Cuando el interceptor de response (REQ-U2) detecte un 401 con `accessToken` activo y el refresh resuelva con éxito, DEBE actualizar el `accessToken` vía `setAccessToken` (REQ-U3) y reintentar la petición original una única vez.

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

Suite: Vitest + Testing Library (`npm test` → `vitest run`). 50/50 tests pasan (8 nuevos/modificados por esta spec); `tsc --noEmit` y `eslint .` limpios.

| REQ | Archivo |
| --- | --- |
| U1  | `src/stores/session.store.test.ts` |
| U2  | `src/services/apiClient.test.ts` |
| U3  | `src/stores/session.store.test.ts` |
| U4  | `src/app/RequireAuth.test.tsx` |
| U5  | `src/app/RequireAuth.test.tsx` |
| S1  | `src/app/RequireAuth.test.tsx` |
| E1  | `src/app/RequireAuth.test.tsx` |
| E2  | `src/services/apiClient.test.ts` |
| X1  | `src/app/RequireAuth.test.tsx` |
| X2  | `src/services/apiClient.test.ts` |
| X3  | `src/services/apiClient.test.ts` |

## Auditoría

> Ref: **api-pos SPEC-008** (`auditoria.spec.md`)

Sin eventos de auditoría nuevos. `POST /auth/refresh` ya está auditado en backend (`AUDIT_ACTIONS.AUTH_REFRESH_TOKEN`, `api-pos/src/routes/v1/auth.routes.ts`) — esta spec reutiliza ese evento existente tanto para el silent-refresh de bootstrap (REQ-U5) como para el reintento del interceptor (REQ-U2), sin distinguir el origen de la llamada en el evento auditado.

## Dependencias

- **Depende de**: SPEC-002 (Login) — dueña de `setTenantSession` y del contrato `LoginTenantResponse`/`LoginSysAdminResponse` que originan la sesión que esta spec ahora persiste parcialmente.
- **Depende de**: SPEC-004 (Completar Perfil) — REQ-U11/S5 son el patrón de `partialize` + guard de hidratación que esta spec extiende de onboarding a tenant; REQ-X2 es el precedente del interceptor de refresh transparente que esta spec replica para la rama de `accessToken`.
- **Depende de** (backend, `api-pos/src/`): `interfaces/auth.interfaces.ts` (`RefreshTenantResponse`), `routes/v1/auth.routes.ts` (`POST /auth/refresh`) — ya implementados, sin cambios requeridos en backend para esta spec.
- **Bloquea**: toda vista protegida por `RequireAuth` (dashboard, panel sysadmin, y cualquier feature de dominio futura) — todas heredan este comportamiento por vivir bajo el mismo guard.
- **Riesgo documentado**: al ampliar `partialize` para incluir `refreshToken` sin condicionarlo por rama, se corrige de paso el gap preexistente de la rama onboarding (ver §Contexto) — requiere un test de regresión que confirme que SPEC-004 REQ-X2 sigue funcionando igual (o mejor) tras este cambio, no solo que SPEC-005 pasa en aislamiento.

## Cambios

- v1.1.0 (2026-07-29): Implementación completa, pasa a `active`. Archivos nuevos/modificados: `stores/session.store.ts` (acción `setAccessToken`, `partialize` extendido con `refreshToken`), `services/apiClient.ts` (`refreshTenantAccessToken` con dedupe module-level, rama tenant del interceptor de response, `TOKEN_REFRESH_ERROR_CODES` renombrado desde `ONBOARDING_TOKEN_ERROR_CODES`), `app/RequireAuth.tsx` (reescrito: hook `useTenantAuthStatus`, gate de hidratación, silent-refresh de bootstrap, `AuthCheckingSkeleton`), `app/useSessionHydrated.ts` (nuevo — extraído de `RequireOnboarding.tsx`, ahora compartido entre ambos guards), `components/Skeleton/` (nuevo, documentado primero en SPEC-001 por regla obligatoria de esa spec). Tests: `session.store.test.ts` (el test que afirmaba `refreshToken` in-memory en rama tenant se corrigió — ya no es cierto tras REQ-U1), `apiClient.test.ts` (3 tests nuevos), `RequireAuth.test.tsx` (nuevo archivo, 5 tests). 50/50 tests pasan, `tsc --noEmit` y `eslint .` limpios.
- v1.0.0 (2026-07-29): Versión inicial (`draft`). Documenta el gap de UX (reload en dashboard fuerza re-login) y el gap preexistente relacionado en la rama onboarding, ambos originados por el mismo campo `refreshToken` no persistido.
