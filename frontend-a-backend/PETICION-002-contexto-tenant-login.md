# Petición 002: `usuarioId` y `empresaId` explícitos en `LoginTenantResponse`

## Metadata

- **Fecha**: 2026-07-29
- **Solicitante**: Equipo Frontend POS-MX
- **Origen**: `alpha-pos` — SPEC-007 (`src/docs/specs/SPEC-007-auth-permisos.md`), REQ-U7, encontrado al implementar el consumo de `GET /auth/permisos` (respuesta a `PETICION-001`)Crees
- **Estado**: Atendido
- **Prioridad**: bloqueante — sin esto, ninguna petición tenant autenticada puede armarse contra el backend real, para ningún usuario que haga login normal (no solo para permisos)

## Problema

Al revisar `middlewares/verificarToken.middleware.ts` para implementar el consumo de `GET /auth/permisos` (`PETICION-001`), confirmamos que en la rama TENANT (cualquier rol que no sea `PENDING_OWNER`) el middleware exige `x-usuario-id` y `x-empresa-id` en **toda** petición autenticada — no es una particularidad de ese endpoint:

- `!usuarioIdHeader` → `401 ERR_MISSING_CONTEXT` (siempre, en cualquier rama)
- rama tenant sin `empresaIdHeader` → `401 ERR_MISSING_CONTEXT`
- `payload.usuarioId !== usuarioIdHeader` o `payload.empresaId !== empresaIdHeader` → `401 ERR_CONTEXT_MISMATCH`

El frontend no tiene forma de construir esos headers para un login normal. Revisamos `interfaces/auth.interfaces.ts`:

```
export interface LoginTenantResponse {
  accessToken: string;
  refreshToken: string;
  perfilCompleto: true;
  sessionConflict?: boolean;
  subscriptionExpired?: boolean;
  subscriptionEnGracia?: boolean;
  mustChangePassword?: boolean;
  sucursalActivaId?: string;
  requiereSeleccionSucursal?: boolean;
}
```

Ni `usuarioId` ni `empresaId` están presentes. `PerfilCompletoResponse` (respuesta de completar-perfil) sí incluye `empresaId` — pero eso solo cubre al usuario que acaba de completar su perfil por primera vez; cualquier login posterior (la inmensa mayoría del uso real del sistema) pasa por `LoginTenantResponse`, que no trae ninguno de los dos campos.

No podemos resolverlo decodificando el JWT en el frontend — está prohibido explícitamente por `CLAUDE.md §6` de nuestro proyecto, y es además el mismo principio que ya aplicaron ustedes al agregar `usuarioId` explícito a las respuestas de onboarding en su momento (`auth-identidad.spec.md` REQ-U16) precisamente para evitar que el frontend decodifique el token.

## Petición concreta

Agregar `usuarioId: string` y `empresaId: string` a `LoginTenantResponse` (`api-pos/src/interfaces/auth.interfaces.ts`), ambos ya disponibles en `payload.usuarioId`/`payload.empresaId` del `AccessTokenPayload` que el propio backend genera al firmar el token — no requiere una consulta nueva a la base de datos, solo exponer en la respuesta lo que ya existe en el payload que se está firmando.

Mismo criterio aplicado a `LoginSysAdminResponse` si ese payload también carga `usuarioId`/algún identificador equivalente — lo dejamos a su criterio si aplica, dado que el panel sysadmin no pasa por `verificarToken` en su rama tenant (usa `verificarSysAdmin`, según el propio middleware) y puede que no tenga la misma exigencia de headers.

## Por qué no se puede resolver desde el frontend

Igual que en `PETICION-001`: no es un tema de manejo de errores del cliente, es que el dato simplemente no existe en ninguna respuesta que el frontend reciba hoy para un login normal. No hay workaround del lado del cliente que no implique decodificar el JWT, que tenemos prohibido por buena razón (mismo principio que ya siguieron ustedes).

## Impacto si no se resuelve

SPEC-007 (REQ-U8/U9) no puede validarse contra el backend real — se puede adelantar el guard `RequirePermission` y los tipos contra un mock, pero ninguna llamada tenant autenticada real (permisos u otra) puede completarse sin `x-empresa-id`, así que el bloqueo se extiende más allá de esta spec a cualquier feature de dominio que empecemos después (ventas, inventario, etc.).

## Referencias

- `api-pos/src/middlewares/verificarToken.middleware.ts` — validación de `x-usuario-id`/`x-empresa-id` en rama tenant
- `api-pos/src/interfaces/auth.interfaces.ts` — `LoginTenantResponse`, `PerfilCompletoResponse` (ya incluye `empresaId`), `AccessTokenPayload`
- `api-pos/src/docs/specs/auth-identidad.spec.md` (ID interno `SPEC-001`) — REQ-U16, precedente de agregar `usuarioId` explícito a respuestas de onboarding por el mismo motivo (evitar decodificar el JWT en frontend)
- `alpha-pos/src/stores/session.store.ts` — confirma que `usuarioId` hoy solo se persiste vía `setOnboardingSession`; `setTenantSession` lo resetea a `null` porque `LoginTenantResponse` nunca lo trajo

## Respuesta de backend

_Pendiente._
