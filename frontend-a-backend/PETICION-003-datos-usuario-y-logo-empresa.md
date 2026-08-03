# Petición 003: Nombre para mostrar del usuario, datos de marca de la empresa (nombre comercial + logo), y acceso total de `superadmin` en `GET /auth/permisos`

## Metadata

- **Fecha**: 2026-08-03
- **Solicitante**: Equipo Frontend POS-MX
- **Origen**: `alpha-pos` — SPEC-008 (`src/docs/specs/SPEC-008-app-layout.md`), REQ-X3/REQ-U9/REQ-O1, encontrado al implementar el chip de usuario y el header de la sidebar de `AppLayout`. Ampliada el mismo día tras observar en pruebas reales que `GET /auth/permisos` responde `403 ERR_SUPERADMIN_PROTECTED` para usuarios con rol `superadmin`.
- **Estado**: Atendido (puntos 1-3 de lectura implementados y consumidos; logo de empresa — subida — queda diferido, ver §Respuesta de backend)
- **Prioridad**: mixta. Nombre/logo (puntos 1-2): no bloqueante, `AppLayout` ya tiene fallback (REQ-X3). Acceso total de `superadmin` (punto 3): **bug funcional real**, no solo cosmético — hoy cualquier usuario tenant con rol `superadmin` ve la sidebar rota (solo "Panel" visible, el resto de los módulos se oculta por el fail-closed de SPEC-007 REQ-X1/X2 ante el error). No bloquea el estado `active` de SPEC-008 (el fail-closed es el comportamiento correcto para cualquier otro tipo de error), pero sí bloquea el uso normal del sistema para ese rol.

## Problema

`AppLayout` (SPEC-008) muestra en la topbar un chip de usuario (avatar + nombre + rol) y en el header de la sidebar la marca del sistema o, si existe, el logo de la empresa en sesión junto a su nombre comercial. Al implementarlo, revisamos todos los contratos disponibles del lado del usuario/empresa autenticado y ninguno trae los datos necesarios:

- `LoginTenantResponse` (`api-pos/src/interfaces/auth.interfaces.ts`): `accessToken`, `refreshToken`, `usuarioId`, `empresaId`, banderas de estado — ningún nombre de usuario ni de empresa.
- `PermisosEfectivosUsuario` (respuesta de `GET /auth/permisos`, `api-pos/src/interfaces/permisos.interfaces.ts`, resuelto por `PETICION-001`): `{ userId, role, modulos }` — tampoco trae nombre de usuario ni ningún dato de la empresa.
- `session.store.ts` (frontend): solo persiste `usuarioId`/`empresaId` (identificadores), nunca datos de perfil — es deliberado, CLAUDE.md §3 prohíbe duplicar en Zustand datos que deberían venir de una consulta al servidor.

Como consecuencia, hoy en producción:

- El chip de usuario de la topbar solo puede mostrar el `role` (ej. "Administradora") con un avatar genérico — nunca un nombre real ni una foto.
- El header de la sidebar siempre muestra la marca del sistema ("D" verde) — nunca el logo ni el nombre comercial de la empresa del tenant, aunque el diseño (validado con wireframe interactivo, ver SPEC-008 §Wireframe) contempla mostrarlo cuando exista.

No es un problema de UI: implementamos ambos fallbacks explícitamente (SPEC-008 REQ-X3 — nunca inventar un nombre ni unas iniciales a partir de datos que no existen) para no bloquear el resto del layout. Pero el dato simplemente no existe en ningún lugar al que el frontend tenga acceso hoy.

**Hallazgo adicional — `GET /auth/permisos` rompe la sidebar completa para `superadmin`**: `SPEC-007 §Contexto` ya documenta que `superadmin` (igual que `sysadmin`, el rol de plataforma) "siempre tiene acceso total y no pasa por esta resolución" de permisos. Consistente con eso, `GET /auth/permisos` responde `403 { code: "ERR_SUPERADMIN_PROTECTED", message: "no se pueden modificar los permisos de superadmin" }` para ese rol en vez de devolver `PermisosEfectivosUsuario`. El problema es que ese mismo endpoint es la **única** fuente que tiene el frontend hoy para el menú de `AppLayout` (`TenantChrome`, SPEC-008 REQ-U12): al fallar la petición, `usePermisos()` queda sin `data`, y `tieneModuloActivo(undefined, ...)` resuelve `false` para todo — comportamiento fail-closed correcto ante un error real (SPEC-007 REQ-X1/X2), pero incorrecto aquí, porque no es un permiso denegado, es "acceso total" expresado como error.

Lo mismo aplicamos nosotros para `sysadmin` (`SysadminChrome` nunca llama `usePermisos()`, SPEC-008 REQ-X4), pero no pudimos replicarlo para `superadmin` porque **no hay ninguna fuente del `role` de la sesión antes de llamar a este mismo endpoint** — ni `LoginTenantResponse` ni `session.store` lo traen; `role` solo llega dentro de `PermisosEfectivosUsuario`, que es precisamente la respuesta que nunca llega para este rol. Es circular: para saber que no debemos llamar al endpoint, primero necesitaríamos el dato que ese endpoint es el único en traer.

La salida más simple del lado del frontend sería capturar el código `ERR_SUPERADMIN_PROTECTED` específicamente y tratarlo como "acceso total" — pero eso pone la fuente de verdad de una decisión de negocio (quién tiene acceso total) en un `if` sobre un string de error en el cliente, en vez de en el backend. Preferimos pedir el cambio correcto del lado del servidor.

## Petición concreta

Proponemos extender la respuesta de `GET /auth/permisos` (`PermisosEfectivosUsuario`) en vez de crear un endpoint nuevo — es la única petición que `AppLayout` ya dispara una vez por sesión (al montar `TenantChrome`, ver SPEC-008 REQ-U12), así que agregar campos ahí evita un segundo round-trip solo para pintar el shell:

1. **`nombre: string`** — nombre para mostrar del usuario autenticado (el mismo que ya se usa en el resto del panel de administración de `api-pos`, si existe una fuente única para eso).
2. **`empresa: { nombre: string; logoUrl: string | null }`** — nombre comercial de la empresa del tenant y URL pública de su logo (o `null` si la empresa no subió uno — el frontend ya maneja ese caso con la marca del sistema como fallback, REQ-U9/S2 de SPEC-008, así que `null` explícito es preferible a omitir el campo).
3. **`GET /auth/permisos` responde `200` también para `superadmin`, con el mismo contrato `PermisosEfectivosUsuario`** — nunca `403 ERR_SUPERADMIN_PROTECTED`. Dentro de ese mismo contrato, agregar `accesoTotal: boolean` en la raíz (`false` para el resto de los roles). Preferimos esto sobre "poblar `modulos` con todo el catálogo activo" porque no depende de que el backend recuerde incluir cada módulo nuevo que se agregue al catálogo — el frontend solo necesita revisar `accesoTotal` antes de filtrar por `tieneModuloActivo`, sin ningún caso especial de manejo de errores.

Forma final propuesta:

```ts
export interface PermisosEfectivosUsuario {
  userId: string;
  role: string;
  nombre: string; // nuevo
  empresa: { nombre: string; logoUrl: string | null }; // nuevo
  accesoTotal: boolean; // nuevo — true para superadmin (y cualquier rol futuro con el mismo criterio)
  modulos: ModuloEfectivo[];
}
```

Si `nombre`/`empresa` requieren una consulta adicional que no vale la pena pagar en cada llamada a `/auth/permisos` (ej. si esa ruta hoy resuelve solo desde el JWT sin tocar la tabla de usuarios/empresas), una alternativa igualmente válida para nosotros es un endpoint separado de solo lectura (ej. `GET /auth/perfil` o `GET /empresas/actual`) con el mismo criterio de auto-referencia que `GET /auth/permisos` (`PETICION-001`): resuelve `usuarioId`/`empresaId` del token, nunca de un parámetro.

Sobre el logo específicamente: si la empresa hoy no tiene forma de **subir** una imagen de marca (no solo de leerla), ese es un problema más grande que esta petición de lectura — se necesitaría además un endpoint de carga (ej. `POST /empresas/actual/logo`, multipart, con las validaciones de tamaño/formato que ya apliquen a otros uploads del sistema, si los hay) y su panel correspondiente en el admin de la empresa. Lo señalamos aquí porque es el paso previo obligatorio para que `logoUrl` alguna vez deje de ser `null`, pero no forma parte del alcance de lectura que bloquea a `AppLayout` hoy.

## Por qué no se puede resolver desde el frontend

Para `nombre`/`empresa` (puntos 1-2): no hay ningún workaround de cliente — ni `nombre` de usuario ni `nombre`/`logoUrl` de empresa existen en ninguna respuesta que el frontend reciba hoy, bajo ninguna rama de login. No es un tema de manejo de errores ni de UX — el dato no está disponible del lado del cliente para empezar.

Para `accesoTotal` (punto 3): técnicamente sí existe un workaround — capturar `ERR_SUPERADMIN_PROTECTED` en `TenantChrome` y tratarlo como acceso total. Decidimos no tomarlo porque mueve la fuente de verdad de una decisión de autorización al frontend, apoyada en el *string* de un código de error en vez de en un campo de datos explícito — el mismo tipo de acoplamiento frágil que `CLAUDE.md §6` ya evita centralizando la normalización de errores en el interceptor. Además es circular: la única forma de saber que una sesión es `superadmin` hoy es que ese mismo endpoint falle primero, así que no hay forma de evitar la llamada de antemano (a diferencia de `sysadmin`, que si se puede detectar antes por `empresaId` en `session.store`).

## Impacto si no se resuelve

Para `nombre`/`empresa`: ninguno bloqueante — `AppLayout` (SPEC-008) ya está `active`, implementado con los fallbacks de REQ-X3 (rol solo en el chip de usuario, marca del sistema en la sidebar). El impacto es puramente de producto/percepción.

Para `accesoTotal`: **funcional, no solo cosmético**. Cualquier usuario tenant con rol `superadmin` inicia sesión y ve la sidebar reducida a un único ítem ("Panel") — no puede navegar a Ventas, Cotizaciones, Inventario, Productos, Almacenes ni Clientes desde el menú, aunque su rol debería tener acceso a todo. Mientras no se resuelva del lado del backend, la alternativa es el workaround frontend descrito arriba (capturar el código de error), que solo tomaríamos como mitigación temporal si el impacto en usuarios reales lo justifica antes de que backend pueda atender esto.

## Referencias

- `alpha-pos/src/docs/specs/SPEC-008-app-layout.md` — REQ-U9 (precedencia logo empresa → marca sistema), REQ-U14 (chip de usuario), REQ-X3 (fallback, nunca inventar datos), REQ-O1 (contrato pendiente), REQ-U10/U12/X2 (menú tenant filtrado por `tieneModuloActivo`, el mecanismo que `accesoTotal` debe poder saltarse)
- `alpha-pos/src/docs/specs/SPEC-007-auth-permisos.md` — §Contexto: "`superadmin` y `sysadmin` siempre tienen acceso total y no pasan por esta resolución" (la regla de negocio que el 403 actual sí respeta, pero de la forma equivocada); REQ-X1/X2 (fail-closed, el motivo por el que el error rompe el menú en vez de degradarlo)
- `alpha-pos/src/layouts/AppLayout/SidebarBrand.tsx` — consumidor de `logoUrl`/`companyName`
- `alpha-pos/src/layouts/AppLayout/UserChip.tsx` — consumidor de `nombre`
- `alpha-pos/src/layouts/AppLayout/TenantChrome.tsx` — único punto donde se llama `usePermisos()` en el contexto tenant; aquí se consumiría `accesoTotal`
- `alpha-pos/src/layouts/AppLayout/SysadminChrome.tsx` — precedente ya implementado del mismo criterio ("acceso total, sin pasar por `usePermisos()`") para el rol de plataforma
- `api-pos/src/interfaces/permisos.interfaces.ts` — `PermisosEfectivosUsuario` (forma actual a extender)
- Código de error observado en pruebas: `403 { code: "ERR_SUPERADMIN_PROTECTED", message: "no se pueden modificar los permisos de superadmin" }` en `GET /auth/permisos`
- `frontend-a-backend/PETICION-001-permisos-self-service.md` — endpoint que esta petición propone extender
- `frontend-a-backend/PETICION-002-contexto-tenant-login.md` — precedente de extender un contrato existente en vez de crear uno nuevo

## Respuesta de backend

Ver `api-pos/backend-a-frontend/RESPUESTA-003-datos-usuario-y-logo-empresa.md` (2026-08-03).

Resumen:

- **Punto 3 (`accesoTotal`)**: confirmado como bug real, no comportamiento intencional — reutilizaban sin distinguir la validación que protege a un superadmin de ser *modificado* por otro usuario. Corregido: `GET /auth/permisos` responde `200` para `superadmin` con `accesoTotal: true` y `modulos: []` (nunca poblado con el catálogo completo, a propósito — tal como propusimos).
- **Puntos 1-2 (nombre/empresa)**: eligieron **endpoint nuevo** (`GET /api/v1/auth/perfil`, self-service, mismo patrón que `/auth/permisos`) en vez de extender `PermisosEfectivosUsuario` como habíamos propuesto — razón válida: un futuro `PATCH` de nombre/branding necesitará un guard de rol distinto al de `/auth/permisos` (self-service abierto a cualquier rol), y mezclar ambos datos en el contrato de autorización habría costado más reordenar después. Responde `{ nombre: string | null; empresa: { nombre: string; logoUrl: string | null } }`. `nombre` se arma como `PerfilUsuario.nombre + ' ' + apellidoPaterno` (supuesto suyo, pendiente de confirmar si esperábamos otro formato) y es `null` explícito si el usuario no tiene `PerfilUsuario`.
- **Logo (subida)**: `logoUrl` está en el contrato pero siempre responde `null` — no existe mecanismo de subida de archivos en todo el proyecto (sin `multer`, sin storage, sin campo en el modelo `Empresa`). Documentado como pendiente explícito en `api-pos/src/docs/pending.md` (Fase 2), fuera de alcance de esta petición.

Implementado en frontend: `usePerfil()` (`GET /auth/perfil`), `tieneAccesoTotal()` consumido en `RequirePermission` y `TenantChrome` (SPEC-007 v1.3.0 REQ-U10/REQ-X5, SPEC-008 v1.2.0 REQ-U12/REQ-X5). Ver detalle en esas specs.
