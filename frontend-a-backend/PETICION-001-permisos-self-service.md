# Petición 001: Endpoint self-service de permisos efectivos

## Metadata

- **Fecha**: 2026-07-29
- **Solicitante**: Equipo Frontend POS-MX
- **Origen**: `alpha-pos` — SPEC-007 (`src/docs/specs/SPEC-007-auth-permisos.md`), bloqueada por este gap
- **Estado**: Atendido
- **Prioridad**: bloqueante — sin esto, el frontend no puede ocultar/proteger UI por rol o permiso para ningún usuario que no sea `superadmin`

## Problema

El frontend necesita que cada usuario autenticado pueda consultar **sus propios** permisos efectivos (módulos y acciones activas) para decidir qué menús, rutas y componentes renderizar. El único endpoint que hoy devuelve ese dato es `GET /admin/usuarios/:userId/permisos` (`api-pos/src/routes/v1/permisos.routes.ts`), protegido por:

`guard = [verificarToken, verificarSuscripcion, verificarRole('superadmin')]`

`verificarRole('superadmin')` rechaza con 403 a cualquier usuario que no sea `superadmin`, sin importar si el `:userId` de la URL coincide con el propio usuario. En la práctica, ningún `admin`, `gerente`, `almacenista`, `comprador`, `contador`, `rrhh` ni `cajero` puede consultar sus propios permisos — precisamente los roles que sí los necesitan para renderizar su UI (`superadmin` tiene acceso total y no depende de esta consulta).

No proponemos quitar ese guard: hacerlo permitiría a cualquier usuario cambiar el `:userId` en la URL y leer los permisos de **otro** usuario de la empresa (IDOR). El caso de uso de esa ruta (panel de administración, un `superadmin` consultando a otros) es legítimamente distinto del caso self-service que necesitamos.

## Petición concreta

Un endpoint nuevo, de solo lectura, que:

1. Requiera únicamente `verificarToken` + `verificarSuscripcion` — accesible a cualquier rol autenticado con suscripción activa, sin `verificarRole`.
2. Resuelva el `userId` **desde el token** (`req.usuarioId`, ya disponible tras `verificarToken`), nunca desde un parámetro de URL — así el endpoint solo puede devolver los permisos del propio llamante, estructuralmente, no por validación adicional.
3. Reutilice `getUsuarioPermisosService(userId, empresaId)` (`api-pos/src/controllers/permisos.controller.ts`), que ya calcula los 4 niveles de precedencia (plan → empresa → rol → usuario) — no requiere tocar el motor de resolución de permisos.
4. Devuelva la misma forma que `PermisosEfectivosUsuario` (`api-pos/src/interfaces/permisos.interfaces.ts`): `{ userId, role, modulos: ModuloEfectivo[] }` — sin inventar un contrato nuevo, para que el frontend reutilice los mismos tipos que ya existen.

**Propuesta de ruta**: `GET /auth/permisos`, junto al resto de rutas self-referenciales de `api-pos/src/routes/v1/auth.routes.ts` (`/auth/logout` ya usa el mismo patrón: `verificarToken` sin `verificarRole`), en vez de agregarla a `permisos.routes.ts` (que es exclusivamente de administración).

## Por qué no se puede resolver desde el frontend

No es un tema de UX ni de manejo de errores — es un guard de servidor (`verificarRole('superadmin')`) que corta la petición antes del controller. Ningún workaround del lado del cliente puede sortear eso, ni debería: la validación de "solo tus propios permisos" tiene que vivir en backend (derivar el `userId` del token, no de params) para ser confiable.

## Impacto si no se resuelve

SPEC-007 permanece en `draft` indefinidamente. El frontend puede adelantar el hook (`usePermisos`), el guard de ruta (`RequirePermission`) y los tipos contra un mock del contrato ya definido, pero no puede validarse ni pasar a `active` sin este endpoint real.

## Referencias

- `api-pos/src/routes/v1/permisos.routes.ts` — guard actual de `/admin/usuarios/:userId/permisos`
- `api-pos/src/routes/v1/auth.routes.ts` — patrón de rutas self-referenciales (`/auth/logout`)
- `api-pos/src/controllers/permisos.controller.ts` — `getUsuarioPermisos`, `getUsuarioPermisosService`
- `api-pos/src/interfaces/permisos.interfaces.ts` — `PermisosEfectivosUsuario`
- `api-pos/src/docs/specs/auth-permisos.spec.md` (ID interno `SPEC-003`) — contrato de autorización vigente

## Respuesta de backend

_Pendiente._
