# Petición 004: `usuarioId`/`empresaId` en toda respuesta que emita o renueve un `accessToken` tenant (empezando por `POST /auth/refresh`)

## Metadata

- **Fecha**: 2026-08-03
- **Solicitante**: Equipo Frontend POS-MX
- **Origen**: `alpha-pos` — SPEC-005 (`auth-sesion-tenant.spec.md`, silent-refresh) / SPEC-008 (`app-layout.md`), encontrado en pruebas reales: al recargar la página con una sesión tenant activa, `AppLayout` no puede distinguir esa sesión de una de `sysadmin` y termina mostrando el menú de plataforma a un usuario tenant. La causa raíz es más amplia que ese síntoma — ver §Problema.
- **Estado**: Pendiente
- **Prioridad**: alta. No bloquea la mitigación de seguridad inmediata que aplicamos en frontend (una señal explícita de tipo de sesión, independiente de `empresaId`), pero sí bloquea que **cualquier** sesión tenant recargada pueda hacer una sola petición autenticada real después del refresh silencioso.

## Problema

`session.store.ts` (frontend) trata `usuarioId`/`empresaId` de la rama tenant con el mismo privilegio que `accessToken` — nunca se persisten en `sessionStorage` (SPEC-007 REQ-U8, decisión deliberada). Al recargar la página:

1. `persist` rehidrata únicamente `{ onboardingToken, refreshToken, usuarioId (solo si onboardingToken existe) }`. En la rama tenant, `onboardingToken` es `null`, así que `usuarioId` **tampoco** se restaura. `empresaId` nunca se restaura bajo ninguna rama.
2. `RequireAuth` detecta `accessToken: null` + `refreshToken` presente y dispara un refresh silencioso contra `POST /auth/refresh` (SPEC-005 REQ-U5), para no forzar un re-login en cada reload.
3. La respuesta de `POST /auth/refresh` (rama tenant) **solo trae `accessToken`**. `setAccessToken()` únicamente actualiza ese campo — `usuarioId`/`empresaId` quedan en `null` de forma permanente hasta el siguiente login completo.
4. El request interceptor de `apiClient.ts` solo adjunta `x-usuario-id`/`x-empresa-id` `if (usuarioId)` / `if (empresaId)`. Con ambos en `null`, ninguna petición tenant posterior al reload lleva esos headers.
5. `verificarToken.middleware.ts` exige `x-usuario-id`/`x-empresa-id` en **toda** petición de la rama tenant, sin excepción (mismo contrato que motivó `PETICION-002`). Sin esos headers, cualquier endpoint tenant real rechazaría con `401 ERR_MISSING_CONTEXT`.

Es decir: hoy, una sesión tenant que sobrevive a un reload gracias al refresh silencioso queda con un `accessToken` válido pero **sin forma de construir ninguna petición tenant real** — el mecanismo que SPEC-005 construyó específicamente para evitar un re-login en cada reload queda, en la práctica, inútil para cualquier feature que dependa de esos headers (que es toda feature tenant, por contrato).

El síntoma que lo hizo visible fue el del menú de `AppLayout`: al no tener `empresaId`, nuestra lógica de "¿qué menú muestro?" interpretó su ausencia como "es una sesión `sysadmin`" — eso ya lo estamos corrigiendo en frontend con una señal explícita, independiente de este dato. Pero el problema de fondo (headers faltantes) no tiene solución del lado del cliente.

**Patrón ya inconsistente entre los endpoints que emiten `accessToken` tenant** — no hay una regla única, se fue resolviendo caso por caso:

| Respuesta | `usuarioId` | `empresaId` |
| --- | --- | --- |
| `LoginTenantResponse` | ✅ (resuelto en `PETICION-002`) | ✅ (resuelto en `PETICION-002`) |
| `PerfilCompletoResponse` (completar-perfil) | — (no cambia respecto al login inicial, el front ya lo tiene de la sesión de onboarding) | ✅ (ya lo traía desde SPEC-004) |
| `RefreshTenantResponse` (`POST /auth/refresh`) | ❌ | ❌ |

## Petición concreta

En vez de pedir el fix puntual para `refresh` (que resolvería el síntoma actual pero dejaría el mismo hueco abierto para el próximo endpoint que emita un `accessToken`), proponemos fijar la regla una sola vez:

**Toda respuesta que emita o renueve un `accessToken` de la rama tenant DEBE incluir `usuarioId` y `empresaId` explícitos, requeridos (no opcionales)** — mismo criterio ya aplicado a `LoginTenantResponse` en `PETICION-002`. Concretamente, hoy eso significa:

1. `RefreshTenantResponse` (`POST /auth/refresh`, cuando la sesión que se renueva es tenant) agrega `usuarioId: string` y `empresaId: string`, ambos ya disponibles en `payload.usuarioId`/`payload.empresaId` del `AccessTokenPayload` que el propio backend firma — mismo origen que ya usaron para `LoginTenantResponse`, no requiere una consulta nueva a la base de datos.
2. Cuando el refresh corresponda a una sesión `sysadmin`, la respuesta se mantiene igual que hoy (sin estos campos) — `verificarSysAdmin` no los exige, mismo criterio que `LoginSysAdminResponse`.
3. Como regla hacia adelante: cualquier endpoint nuevo que emita o renueve un `accessToken` tenant (hoy no existe ninguno más además de login/completar-perfil/refresh, pero si apareciera) sigue este mismo contrato por defecto, sin que tengamos que volver a pedirlo endpoint por endpoint.

## Por qué no se puede resolver desde el frontend

Ya evaluamos y descartamos las alternativas de nuestro lado:

- **Decodificar el JWT en el cliente** para extraer `usuarioId`/`empresaId` sin pedírselos a backend — prohibido explícitamente por `CLAUDE.md §6` de nuestro proyecto; es el mismo principio que backend ya aplicó en `PETICION-002` (exponer los campos explícitos en vez de forzar al frontend a leer el payload del token).
- **Pedirlos con una llamada autenticada aparte** (ej. un endpoint de "contexto de sesión") — no resuelve nada: `verificarToken.middleware.ts` exige `x-usuario-id`/`x-empresa-id` en toda petición tenant, así que necesitaríamos ya tener esos datos para poder pedirlos. Problema de huevo y gallina.
- **Persistirlos en `sessionStorage`** para no depender de que cada respuesta los reenvíe — contradice SPEC-007 REQ-U8, que los trata deliberadamente con el mismo privilegio que `accessToken` (in-memory únicamente). No es una decisión que nos corresponda revertir unilateralmente desde el frontend.

Con esas tres descartadas, la única fuente posible es la respuesta del propio backend cuando emite o renueva el token.

## Impacto si no se resuelve

- **Funcional (bloqueante para cualquier feature tenant real)**: una sesión tenant que sobrevive a un reload vía refresh silencioso no puede completar ninguna petición tenant autenticada — se rechazaría con `401 ERR_MISSING_CONTEXT` por falta de headers. Hoy esto queda enmascarado porque nuestros hooks (`usePermisos`/`usePerfil`) simplemente no disparan la petición sin `usuarioId` (`enabled: false`) — no es que fallen, es que ni lo intentan — pero en cuanto exista cualquier feature de dominio (ventas, inventario, etc.) que dependa de esos headers, se romperá en producción para cualquier usuario que recargue la página.
- **Seguridad (mitigado en frontend, no depende de esta petición)**: el síntoma que lo hizo visible — `AppLayout` mostrando el menú de `sysadmin` a un usuario tenant tras un reload — ya lo resolvemos con una señal explícita de tipo de sesión en el store, independiente de `empresaId`. No queda pendiente de esta respuesta.
- Mientras no se resuelva, la única mitigación de nuestro lado sería forzar un re-login completo en cada reload (renunciar al silent-refresh de SPEC-005 para la rama tenant) — es un paso atrás real en UX que preferimos no tomar si esto se puede resolver del lado del backend en un cambio acotado.

## Referencias

- `alpha-pos/src/stores/session.store.ts` — `partialize`, `setAccessToken`, comentarios REQ-U8
- `alpha-pos/src/services/apiClient.ts` — `refreshTenantAccessToken`, request interceptor (headers condicionados a `usuarioId`/`empresaId`)
- `alpha-pos/src/app/RequireAuth.tsx` — `useTenantAuthStatus`, disparo del refresh silencioso
- `alpha-pos/src/layouts/AppLayout/AppLayout.tsx` — donde se manifestó el síntoma (SPEC-008)
- `alpha-pos/src/docs/specs/SPEC-005-auth-sesion-tenant.md` — silent-refresh (REQ-U4/U5)
- `alpha-pos/src/docs/specs/SPEC-007-auth-permisos.md` — REQ-U7/U8/U9 (headers tenant obligatorios, mismo contrato que motiva esta petición)
- `api-pos/src/middlewares/verificarToken.middleware.ts` — validación de `x-usuario-id`/`x-empresa-id` en rama tenant, exigida en toda petición
- `api-pos/src/interfaces/auth.interfaces.ts` — `RefreshTenantResponse` (forma actual a extender), `LoginTenantResponse` (precedente ya resuelto)
- `frontend-a-backend/PETICION-002-contexto-tenant-login.md` — mismo problema, mismo fix, para el endpoint de login
- `api-pos/backend-a-frontend/RESPUESTA-002-contexto-tenant-login.md` — precedente de la solución ya aplicada

## Respuesta de backend

_Pendiente._
