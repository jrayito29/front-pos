# Sesión: `SPEC-005 (sesión tenant) + SPEC-006 (code splitting) + gestión SPEC-007` — `2026-07-29`

## Metadata

| Campo         | Valor                                                        |
| ------------- | ------------------------------------------------------------- |
| **Fecha**     | 2026-07-29                                                     |
| **ID Sesión** | `spec-005-006-sesion-tenant-code-splitting-2026-07-29`         |
| **Owner**     | Equipo Frontend POS-MX                                         |
| **Estado**    | completada (SPEC-005, SPEC-006) · pausada (SPEC-007, bloqueada por backend) |

---

## Objetivo de la Sesión

Resolver tres problemas de arquitectura reportados por el usuario tras probar el flujo de onboarding: (1) un reload en el dashboard fuerza re-login aunque la sesión siga vigente en backend, (2) no hay code splitting — visitar `/login` descarga también el wizard de completar-perfil, (3) falta un sistema de permisos/roles en el frontend. Documentar cada uno como spec (`SPEC-005/006/007`), implementar los dos que no dependían de backend, y gestionar la comunicación formal con el equipo de backend para el tercero.

---

## Trabajo Realizado

### Decisiones tomadas

- **Documentar todo como spec en `docs/specs/`, sin carpetas separadas `business/`/`design/`** — el campo `Dominio` del template ya cubre esa clasificación, y separar en carpetas rompería el glob plano que asume `_POLICY.md` (compartido con `api-pos`).
- **Registro formal de peticiones/respuestas a backend** en `frontend-a-backend/` (nuevo, creado por el usuario) — cada petición numerada (`PETICION-NNN`), con su respuesta esperada en el mismo archivo o en el `backend-a-frontend/` del otro repo.
- **SPEC-005 (persistencia de sesión tenant)**: persistir solo `refreshToken` (nunca `accessToken`) y hacer silent-refresh en el bootstrap — mismo patrón ya validado en SPEC-004 para la rama onboarding, extendido a tenant.
- **SPEC-006 (code splitting)**: split a nivel de ruta completa (una ruta = un chunk), nunca a nivel de subcomponente de un mismo flujo secuencial (ej. los pasos del wizard viajan juntos). Los `lazy()` deben apuntar al archivo propio de cada componente, no al barrel de la feature — excepción documentada a "solo consumir vía `index.ts`" (CLAUDE.md §3), limitada a `app/router.tsx` como raíz de composición.
- **`LazyWidget` (REQ-U5/X2 de SPEC-006) sin `React.lazy()`/`use()`/`Suspense` real** — ver hallazgo técnico abajo. Se optó por un patrón manual (`useState`/`useEffect`) tras confirmar que la alternativa con `use()` entra en loop.
- **SPEC-007 (permisos) se declaró bloqueada** en dos rondas: primero por falta de endpoint self-service (resuelto por backend en el día, ver `PETICION-001`), luego por un gap más profundo encontrado al revisar el contrato de headers (`usuarioId`/`empresaId` ausentes de `LoginTenantResponse`) — no se implementó, queda en `draft` a la espera de `PETICION-002`.

### Implementaciones

- [x] SPEC-005 — persistencia de `refreshToken` de tenant + silent-refresh en bootstrap + interceptor extendido, completa y con tests (`active`).
- [x] SPEC-006 — code splitting por ruta + patrón `LazyWidget` para componentes pesados anidados, completa y con tests (`active`), verificada con build real.
- [x] `PETICION-001` (self-service de permisos) redactada y respondida por backend el mismo día.
- [x] SPEC-007 actualizada con la respuesta de backend + `PETICION-002` (gap de `usuarioId`/`empresaId` en `LoginTenantResponse`) — permanece en `draft`, bloqueada.
- [ ] SPEC-007 (implementación) — pendiente de respuesta a `PETICION-002`.
- [ ] Bug preexistente en `CompletarPerfilWizard.tsx` (`tsc -b` falla) — reportado en informe separado, no corregido en esta sesión (fuera de alcance).

---

## Archivos Creados

| Archivo                                                              | Descripción                                                                 |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `frontend-a-backend/PETICION-001-permisos-self-service.md`             | Petición formal: endpoint self-service de permisos efectivos                 |
| `frontend-a-backend/PETICION-002-contexto-tenant-login.md`             | Petición formal: `usuarioId`/`empresaId` explícitos en `LoginTenantResponse` |
| `src/docs/specs/SPEC-005-auth-sesion-tenant.md`                        | Persistencia de `refreshToken` de tenant + silent-refresh                    |
| `src/docs/specs/SPEC-006-routing-code-splitting.md`                    | Code splitting por ruta (lazy loading) + patrón de widgets anidados          |
| `src/docs/specs/SPEC-007-auth-permisos.md`                             | Consumo de permisos por módulo/acción desde el front (bloqueada)             |
| `src/app/useSessionHydrated.ts`                                        | Hook compartido de rehidratación, extraído de `RequireOnboarding`            |
| `src/components/Skeleton/Skeleton.tsx` + `index.ts`                    | Componente base nuevo (documentado primero en SPEC-001)                      |
| `src/app/RouteErrorBoundary.tsx` + `.test.tsx`                         | Captura fallas de chunk de ruta, botón "Recargar" (SPEC-006 REQ-X1)          |
| `src/app/RouteLoadingSkeleton.tsx`                                     | Fallback de `Suspense` a nivel de ruta (SPEC-006 REQ-U2/S1)                   |
| `src/app/LazyWidget.tsx` + `.test.tsx`                                 | Patrón reutilizable de split anidado para widgets pesados (SPEC-006 REQ-U5/X2) |
| `src/app/router.test.tsx`                                              | Smoke test end-to-end de `AppRouter` con lazy loading                        |
| `src/app/RequireAuth.test.tsx`                                         | Tests del guard reescrito (SPEC-005)                                         |

## Archivos Modificados

| Archivo                                              | Cambio realizado                                                                                     |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `src/docs/specs/SPEC-001-design-system.md`              | Se agregó la entrada de `Skeleton` (requisito obligatorio antes de codificarlo)                       |
| `src/docs/specs/SPEC-004-auth-completar-perfil.md`      | Nota cruzada: REQ-U11 (`partialize`) fue extendido por SPEC-005 REQ-U1, sin reescribir el REQ original |
| `src/stores/session.store.ts`                           | Acción `setAccessToken`; `partialize` extendido con `refreshToken` (compartido onboarding/tenant)     |
| `src/services/apiClient.ts`                             | Rama tenant del interceptor de refresh + `refreshTenantAccessToken` con dedupe; renombrado `TOKEN_REFRESH_ERROR_CODES` |
| `src/app/RequireAuth.tsx`                               | Reescrito: gate de hidratación, silent-refresh de bootstrap, skeleton de carga, fallo silencioso      |
| `src/app/RequireOnboarding.tsx`                         | Usa `useSessionHydrated` compartido en vez de definición local                                        |
| `src/app/router.tsx`                                    | Los 4 componentes de auth pasan a `React.lazy()` (import directo al archivo, no al barrel) + `Suspense`/`RouteErrorBoundary` |
| `src/stores/session.store.test.ts`                      | Corregido test desactualizado de REQ-U11 (ya no es cierto que `refreshToken` quede solo in-memory); tests nuevos de REQ-U1/U3 |
| `src/services/apiClient.test.ts`                        | Tests nuevos: refresh de tenant, fallo con toast+redirect, dedupe de llamadas concurrentes             |

---

## SPECs Involucrados

| SPEC                                     | Versión | Estado al cierre |
| ------------------------------------------ | ------- | ------------------ |
| `SPEC-001-design-system.md`                | —       | draft (sin cambio de versión formal; se agregó `Skeleton`) |
| `SPEC-004-auth-completar-perfil.md`        | v1.3.1  | active (nota cruzada agregada, sin bump) |
| `SPEC-005-auth-sesion-tenant.md`           | v1.1.0  | active |
| `SPEC-006-routing-code-splitting.md`       | v1.2.0  | active |
| `SPEC-007-auth-permisos.md`                | v1.1.0  | draft — bloqueada por `PETICION-002` |

---

## Supuestos Declarados

- El silent-refresh de bootstrap (SPEC-005) usa un skeleton genérico de "layout de dashboard" (`AuthCheckingSkeleton` dentro de `RequireAuth.tsx`) porque `AppLayout` real todavía no existe como feature — se deberá revisar/ajustar cuando se construya el layout definitivo.
- `LazyWidget` (SPEC-006) se implementó sin `Suspense`/`React.lazy()` real por los motivos técnicos documentados en la spec y en el informe de riesgos abajo — es una decisión tomada unilateralmente durante la implementación, no confirmada explícitamente con el usuario antes de aplicarla (se reportó después, como parte del resumen de cierre de SPEC-006).
- Se asumió que el bug de `CompletarPerfilWizard.tsx` (ver informe separado) es puramente preexistente y no relacionado con los cambios de esta sesión — no se tocó ese archivo en ningún momento, pero no se confirmó con un histórico de builds anteriores (no hay control de versiones en este repo) que el bug ya existiera antes de esta sesión.

---

## Pendientes / Próxima Sesión

- [ ] Implementar SPEC-007 en cuanto backend responda `PETICION-002`.
- [ ] Corregir el bug de tipos en `CompletarPerfilWizard.tsx` (ver informe: `bug-tipos-completar-perfil-wizard-2026-07-29.md`) — bloquea `npm run build` hoy.
- [ ] Aprobación requerida: ninguna inmediata; el usuario decidirá si abre seguimiento seguimiento del bug o lo prioriza junto con el resto del backlog.

---

## Notas y Observaciones

- `tsc --noEmit` desde la raíz del proyecto **no estaba revisando nada real** durante toda la sesión previa a este hallazgo: `tsconfig.json` raíz declara `"files": []` y delega todo a `references` (`tsconfig.app.json`/`tsconfig.node.json`), que solo se resuelven con `tsc -b`. Cualquier verificación de tipos futura debe usar `npx tsc -p tsconfig.app.json --noEmit` o `npm run build`, no `tsc --noEmit` a secas.
- El patrón de `LazyWidget` (sin Suspense real) queda como el estándar a seguir para futuros widgets pesados (gráficas de Recharts en reportes) — cualquier feature nueva que necesite este patrón debe reutilizar `app/LazyWidget.tsx`, no reimplementarlo.
- El registro `frontend-a-backend/` (creado por el usuario en esta sesión) queda como canal formal de comunicación con el equipo de backend; ya tiene 2 peticiones (una resuelta el mismo día, una pendiente).

---

## Riesgos Identificados

| Riesgo                                                                 | Impacto | Acción sugerida                                                                 |
| ------------------------------------------------------------------------ | :-------: | ---------------------------------------------------------------------------- |
| `npm run build` roto por bug preexistente en `CompletarPerfilWizard.tsx` | Alto    | Corregir antes de cualquier intento de deploy/CI real (ver informe dedicado)   |
| SPEC-007 bloqueada por dependencia externa (backend)                    | Medio   | Dar seguimiento a `PETICION-002`; no iniciar features de dominio que dependan de permisos hasta resolverse |
| `LazyWidget` implementado sin `Suspense` real, contrario a la redacción original de REQ-U5 | Bajo    | Ya documentado en SPEC-006 §Cambios/REQ-U5 como nota de implementación; revisar si el equipo prefiere retomar el intento con `Suspense` en una iteración futura con más tiempo de investigación |
