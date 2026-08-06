# SPEC-011: Módulo de Usuarios — Gestión de Cuentas de Acceso (Superadmin)

## Metadata

- **ID**: SPEC-011
- **Dominio**: admin
- **Versión**: 1.0.0
- **Estado**: draft
- **Owner**: `Equipo Frontend POS-MX`
- **Creada**: 2026-08-05
- **Última revisión**: 2026-08-05

## Contexto

El backend (`api-pos`) expone el módulo de Gestión de Usuarios del Sistema (`SPEC-013`, dominio `admin`, ver `src/docs/doc-api.md`): alta de cuentas de acceso al POS, cambio de rol y desactivación (soft delete), exclusivo del rol `superadmin` en los cinco endpoints (`POST/GET/GET :id/PATCH :id/rol/DELETE :id /api/v1/usuarios`). A diferencia de Categorías (`SPEC-010`) y Productos (`SPEC-009`), este módulo **no** está protegido por el catálogo dinámico de permisos (`SPEC-003` backend, `modulo.*`/`verificarPermiso`) — cada endpoint valida el rol del actor directamente contra `superadmin` (`verificarRole`, ver `usuarios-gestion.spec.md` REQ-U1). No existe una clave `modulo.usuarios` en el catálogo de permisos: es un rol de plataforma fijo, no una activación por plan/empresa/rol configurable.

**Distinción importante de nomenclatura**: el sidebar de `SPEC-008` ya tiene un ítem "Usuarios" en `SYSADMIN_NAV` (`ROUTES.SYSADMIN_USUARIOS`, `/admin/usuarios`) — es un `RouteStub` del panel de **plataforma** (contexto `sysadmin`, empresas/planes/auditoría globales), sin relación con este módulo. Esta spec documenta un módulo **distinto**: gestión de usuarios **dentro de una empresa/tenant**, visible únicamente para el rol `superadmin` de esa empresa, en una ruta nueva (`/usuarios`).

Decisiones clave de diseño para esta spec (conversación con el usuario, mismo criterio de "no wireframe interactivo previo" que `SPEC-009`/`SPEC-010`):

1. **Nuevo guard `app/RequireRole`, no `RequirePermission`** — dado que el backend gatea por rol estático y no por módulo dinámico, se introduce un guard nuevo y más simple que compara `data.role === 'superadmin'` directamente. Esto **no** reintroduce la deuda que `SPEC-010` (REQ-U9) resolvió al retirar `CATEGORIA_ROLES_ESCRITURA`: aquella deuda era comparar `data.role` contra un catálogo que el backend **sí** exponía dinámicamente (`modulo.categorias`/`categorias.*`); aquí no existe tal catálogo — `superadmin` es, por contrato de backend, el único rol que puede operar este módulo, sin importar plan/empresa/overrides. `RequireRole` reutiliza el mismo `usePermisos()` (`PermisosEfectivosUsuario.role`, ya disponible sin endpoint nuevo) que `RequirePermission`, con el mismo fail-closed y el mismo skeleton mientras carga.
2. **Listado + modales, sin rutas propias** — igual que Categorías: el modelo tiene pocos campos y no amerita `/usuarios/nuevo` ni `/usuarios/:id` como Productos.
3. **Superficie de escritura más angosta que Categorías** — el backend **no** expone edición de perfil (`nombre`/`apellidos`/`telefono`) después de la creación. Solo existen tres mutaciones: crear (alta con contraseña temporal), cambiar rol, desactivar. No hay `UsuarioFormModal` en modo "editar" — sería un formulario fantasma contra un endpoint que no existe.
4. **Patrón nuevo: "revelar una sola vez"** — no hay precedente en el frontend para mostrar un secreto (`contraseñaTemporal`) que el backend garantiza no repetir. Se introduce `UsuarioCreadoModal`, específico de este módulo.
5. **Autodesactivación bloqueada preventivamente en UI** — el backend rechaza con `ERR_USER_SELF_DEACTIVATION` (422) si el superadmin intenta desactivarse a sí mismo; la UI lo anticipa deshabilitando la acción sobre su propia fila (comparando contra `usuarioId` de `session.store`), dejando el rechazo del backend como red de seguridad, mismo criterio que la cascada de `SPEC-010` REQ-E2.
6. **Sidebar: nuevo ítem bajo "Configuración"** — se agrega "Usuarios" al mismo grupo expandible que `SPEC-010` introdujo para Categorías, gateado por rol (no por módulo) — requiere extender `NavItemConfig` con un campo nuevo (`soloRol`), primer caso de filtrado de menú por rol estático en vez de permiso dinámico.

## Wireframes

Referencia (ASCII, síntesis de la conversación de diseño — mismo criterio que `SPEC-009`/`SPEC-010` §Wireframes):

```
Listado — /usuarios
┌────────────────────────────────────────────────────────────────────────┐
│ Usuarios                                                 [+ Agregar]   │
│ ┌───────────────────────────┐ ┌────────────┐                          │
│ │ Buscar por nombre o email │ │ Filtros (1)│                          │
│ └───────────────────────────┘ └────────────┘                          │
├────────────────────────────────────────────────────────────────────────┤
│ Nombre               Email                  Rol         Alta        ⋮ │
│ ──────────────────────────────────────────────────────────────────── │
│ Juan García           juan@empresa.com       ● Cajero    21/05/26    ⋮ │
│ Ana López (Tú)         ana@empresa.com       ● Superadmin 10/01/26    – │
├────────────────────────────────────────────────────────────────────────┤
│                                                  ‹ 1 2 3 ›  20 / página │
└────────────────────────────────────────────────────────────────────────┘
  ↑ clic en fila abre UsuarioDetalleModal (no navega)
  ↑ fila del propio usuario: acción "Desactivar" deshabilitada (⋮ → "–"), ver REQ-S2

UsuarioDetalleModal                      UsuarioFormModal (solo crear)
┌──────────────────────────────┐        ┌──────────────────────────────┐
│ Juan García                   │        │ Nuevo usuario                 │
│ juan@empresa.com               │        │ Email*    [____________]      │
│ Rol  [Cajero ▾]  (cambia al instante)  │ Rol*      [Cajero ▾]           │
│ Teléfono: 55-1234-5678          │        │ Nombre*   [____________]      │
│ Alta: 21/05/2026                 │        │ Apellido paterno* [________] │
│ ─────────────────────────────    │        │ Apellido materno  [________] │
│              [Desactivar]         │        │ Teléfono           [________] │
└──────────────────────────────┘         │            [Cancelar][Crear]  │
                                          └──────────────────────────────┘

UsuarioCreadoModal (tras crear — se muestra UNA sola vez)
┌────────────────────────────────────────────┐
│ ✓ Usuario creado                            │
│ juan@empresa.com · Cajero                    │
│                                               │
│ Contraseña temporal                          │
│ ┌───────────────────────────┐ [Copiar]       │
│ │ Ax3$mP9kLq2!              │                │
│ └───────────────────────────┘                │
│ ⚠ Esta contraseña no volverá a mostrarse.    │
│   Entrégala al usuario; expira en 72 horas.  │
│                                               │
│                        [Entendido, cerrar]   │
└────────────────────────────────────────────┘
```

## Requisitos en formato EARS

### Ubiquitous (siempre aplica)

- **REQ-U1**: La ruta `/usuarios` (`ROUTES.USUARIOS`, nueva) DEBE renderizar `UsuariosListPage`, consumiendo `GET /api/v1/usuarios` vía `useUsuarios()` (TanStack Query) con `page, limit, role, search` reflejados en el estado de filtros — mismo patrón de toolbar (buscador + `FilterPopover` con badge) y `components/DataTable` genérico que `SPEC-009`/`SPEC-010` establecieron.
- **REQ-U2**: El sistema DEBE introducir un guard nuevo, `app/RequireRole`, análogo a `RequirePermission` (`SPEC-007` REQ-U4) pero comparando `data.role === role` (prop del guard) en vez de `tieneModuloActivo`/`tieneAccesoTotal`. DEBE reutilizar el mismo `usePermisos()` (`PermisosEfectivosUsuario.role`, ya disponible sin endpoint nuevo — `GET /auth/permisos` responde para cualquier usuario tenant autenticado) — nunca crear una petición o hook nuevo solo para leer el rol. Mismo fail-closed (`isLoading` o error ⇒ no autorizado) y mismo skeleton de espera que `RequirePermission` (`SPEC-007` REQ-S1).
- **REQ-U3**: La ruta `/usuarios` DEBE montarse con `RequireRole role="superadmin"` — nunca `RequirePermission`, porque no existe una clave `modulo.usuarios` en el catálogo dinámico de permisos (`SPEC-003` backend): el backend gatea los cinco endpoints de este módulo con `verificarRole('superadmin')` directo (`usuarios-gestion.spec.md` REQ-U1), no con `verificarPermiso`. Esta comparación directa de `role` es una excepción deliberada y documentada — no una regresión de la deuda que `SPEC-010` REQ-U9 retiró (`CATEGORIA_ROLES_ESCRITURA`): aquella comparaba `role` contra un catálogo que el backend sí resolvía dinámicamente; aquí no existe tal catálogo para comparar.
- **REQ-U4**: Las columnas del listado DEBEN limitarse a Nombre completo (`nombre` + `apellidoPaterno` [+ `apellidoMaterno` si existe]), Email, Rol (badge, etiqueta vía `USUARIO_ROL_LABEL`) y Fecha de alta (`createdAt`) — nunca exponer más campos de `UsuarioListItemDTO` en el listado.
- **REQ-U5**: La superficie de escritura del módulo DEBE limitarse a: crear (`UsuarioFormModal`, sin modo edición), cambiar rol (`UsuarioRolControl` dentro de `UsuarioDetalleModal`) y desactivar (`DesactivarUsuarioModal`, confirmación). NO DEBE existir un modal o ruta de "editar perfil" (nombre/apellidos/teléfono/email) — el backend (`SPEC-013`) no expone ningún endpoint de actualización de esos campos tras la creación; construir ese formulario sería un flujo sin backend contra el cual resolver.
- **REQ-U6**: `UsuarioRolControl` DEBE ser un `Select` con las 7 opciones de `ROLES_ASIGNABLES` (`admin`, `gerente`, `almacenista`, `comprador`, `contador`, `rrhh`, `cajero`) — nunca un `Switch`: mismo criterio que `SPEC-010` REQ-U7 distinguió `ProductoEstadoControl` (`Select`, >2 valores) de `CategoriaEstadoControl` (`Switch`, binario).
- **REQ-U7**: Cuando `POST /api/v1/usuarios` complete con éxito (201), el sistema DEBE mostrar `UsuarioCreadoModal` (patrón nuevo, sin precedente en el frontend) con `email`, `role`, `nombre`, `contraseñaTemporal` (texto plano) y `passwordTempExpires`, más un botón "Copiar" (Clipboard API) y una advertencia explícita de que la contraseña no volverá a mostrarse. La `contraseñaTemporal` NUNCA debe pasar por `console.log`, un store persistente, ni sobrevivir más allá del estado local de este modal (CLAUDE.md §9) — se descarta al cerrarlo.
- **REQ-U8**: El sidebar DEBE agregar un ítem "Usuarios" al grupo expandible "Configuración" (`navConfig.ts`, mismo grupo que `SPEC-010` introdujo para Categorías), gateado por un campo nuevo `soloRol?: string` en `NavItemConfig` (en vez de `modulo`) — filtrado en `TenantChrome.tsx` comparando `data?.role === item.soloRol` cuando ese campo está presente. Es el primer `NavItemConfig` del proyecto sin `modulo` que tampoco es de acceso universal (a diferencia de "Panel").
- **REQ-U9**: El sistema DEBE crear `features/usuarios/constants/usuario.constants.ts`, espejo 1:1 de `api-pos/src/constants/usuarios.constants.ts` (`ROLES_ASIGNABLES`, `USUARIO_ERRORS`) — mismo criterio de comentario "espejo 1:1" que `CATEGORIA_ERRORS`/`PRODUCTO_ERRORS` — más `USUARIO_ERROR_CODE_TO_FIELD` (tabla código→campo) y `USUARIO_ROL_LABEL` (etiquetas en español: Administrador, Gerente, Almacenista, Comprador, Contador, Recursos Humanos, Cajero). Este módulo NO define un catálogo `USUARIO_ACCION`/`puedeAccion` (a diferencia de `CATEGORIA_ACCION`/`PRODUCTO_ACCION`) — no aplica, ver REQ-U3.
- **REQ-U10**: Los filtros del listado (`role`, `search`) DEBEN resolverse con el mismo patrón "draft vs. aplicado" de `FilterPopover` (`SPEC-010` REQ-U1) — el filtro `role` puebla su `Select` con `ROLES_ASIGNABLES`/`USUARIO_ROL_LABEL`, badge con la cantidad de filtros activos.

### State-driven (mientras X)

- **REQ-S1**: Mientras `useUsuarios()`/`useUsuario()` estén en `isLoading`, la vista/modal correspondiente DEBE mostrar un skeleton acotado (`TableRowsSkeleton` en el listado) — nunca un spinner genérico (CLAUDE.md §8, mismo criterio `SPEC-009` REQ-S1/`SPEC-010` REQ-S1).
- **REQ-S2**: Mientras la fila o el detalle correspondan al mismo `usuarioId` de la sesión activa (`session.store`), la acción "Desactivar" (columna de acciones del listado y botón de `UsuarioDetalleModal`) DEBE mostrarse deshabilitada, con una nota explicando que no es posible autodesactivarse — anticipa `ERR_USER_SELF_DEACTIVATION` (422) del backend en vez de dejar que el usuario descubra el rechazo tras confirmar.
- **REQ-S3**: Mientras `UsuarioCreadoModal` esté abierto, el botón "Copiar" DEBE reflejar el estado de copiado (ej. "Copiado ✓" temporal tras el click) — el modal solo se cierra con el botón explícito "Entendido, cerrar", nunca con click fuera ni `Escape`, dado que su contenido es un secreto que no se puede recuperar después.

### Event-driven (cuando X)

- **REQ-E1**: Cuando el usuario haga clic en una fila del listado, el sistema DEBE abrir `UsuarioDetalleModal` con el `id` de esa fila y disparar `GET /:id` — nunca reutilizar los datos de la fila (`UsuarioListItemDTO` no incluye `telefono`, que sí trae `UsuarioDetalleDTO.perfil`).
- **REQ-E2**: Cuando `POST /api/v1/usuarios` complete con éxito, el sistema DEBE cerrar `UsuarioFormModal`, invalidar `['usuarios']` (REQ-E5) y abrir inmediatamente `UsuarioCreadoModal` (REQ-U7) con los datos de la respuesta — sin mostrar además un toast de éxito genérico: el modal de revelado ya es la confirmación visual del éxito, un toast adicional sería una redundancia de feedback sobre el mismo evento.
- **REQ-E3**: Cuando el usuario cambie el valor de `UsuarioRolControl` y la mutación `PATCH /:id/rol` complete con éxito, el sistema DEBE actualizar el detalle en el propio modal (sin cerrarlo), invalidar `['usuarios']` (REQ-E5) y mostrar `toast.success('Rol actualizado')`.
- **REQ-E4**: Cuando el usuario confirme "Desactivar" en `DesactivarUsuarioModal` (copy que indica que se revocan las sesiones activas del usuario y se bloquea su acceso de inmediato, ver `usuarios-gestion.spec.md` Flujo B) y `DELETE /:id` complete con éxito, el sistema DEBE cerrar `UsuarioDetalleModal` (si estaba abierto sobre ese usuario), invalidar `['usuarios']` (REQ-E5) y mostrar `toast.success('Usuario desactivado')` — mismo criterio de confirmación destructiva que `EliminarCategoriaModal` (`SPEC-010`).
- **REQ-E5**: Cuando cualquier mutación de escritura (crear, cambiar rol, desactivar) se complete con éxito, el sistema DEBE invalidar `['usuarios']` en bloque (`invalidateUsuarioQueries`, predicate sobre el primer segmento del query key) — mismo patrón que `invalidateCategoriaQueries` (`SPEC-010` REQ-E6, CLAUDE.md §6), nunca depender solo de `staleTime`.

### Unwanted (si X entonces)

- **REQ-X1**: Si `GET /api/v1/usuarios` falla (red/servidor), la vista NO DEBE renderizar `DataTable` — DEBE mostrar un bloque de error con mensaje y acción "Reintentar" (`refetch`), mismo criterio `SPEC-009`/`SPEC-010` REQ-X1.
- **REQ-X2**: Si el total de usuarios de la empresa es 0 sin ningún filtro aplicado, el sistema DEBE mostrar un estado vacío dedicado ("Aún no has creado usuarios" + botón "Agregar"); si hay filtros o búsqueda activos y el resultado es 0, DEBE mostrar un estado vacío distinto ("No se encontraron usuarios con estos filtros" + botón "Limpiar") — mismo criterio `SPEC-009`/`SPEC-010` REQ-X2/X3.
- **REQ-X3**: Si un usuario cuyo `role !== 'superadmin'` navega directo a `/usuarios`, el sistema DEBE redirigir a `/no-autorizado` vía `RequireRole` (REQ-U2/U3) — no debe llegar a disparar `GET /api/v1/usuarios` (`enabled` de `useUsuarios` condicionado a `data?.role === 'superadmin'`), mismo criterio `SPEC-009`/`SPEC-010` REQ-X5/X3.
- **REQ-X4**: Si la mutación de `UsuarioFormModal` falla con un código de negocio mapeable a un campo (`ERR_EMAIL_ALREADY_EXISTS` → `email`; `ERR_ROLE_INVALID` → `role`), el sistema DEBE resolver el campo vía `USUARIO_ERROR_CODE_TO_FIELD` y aplicar `setError` (reutilizando `lib/applyApiError.ts`, mismo patrón de dos niveles que `applyCategoriaApiError`/`applyProductoApiError`).
- **REQ-X5**: Si la mutación de `UsuarioRolControl` falla con `ERR_ROLE_INVALID`, el sistema DEBE anclar el error al propio control (mismo mapeo `USUARIO_ERROR_CODE_TO_FIELD`). Si falla con `ERR_USER_NOT_FOUND` o `ERR_PERMISSION_DENIED` (sin campo de formulario asociado en este contexto — la fila pudo desactivarse desde otra sesión), el sistema DEBE mostrar un toast con `error.message` y refrescar el listado (`refetch`), nunca forzar un `setError` sin campo real al que anclarse.
- **REQ-X6**: Si la mutación de `DesactivarUsuarioModal` falla (`ERR_USER_NOT_FOUND`, `ERR_USER_SELF_DEACTIVATION` — carrera si el `usuarioId` de sesión cambió entre la carga del listado y el clic, o `ERR_PERMISSION_DENIED`), el sistema DEBE mostrar un toast con `error.message` — es una red de seguridad sobre REQ-S2, no el camino esperado, mismo criterio que la cascada de `SPEC-010` REQ-E2.
- **REQ-X7**: Si el usuario cierra `UsuarioFormModal`, `UsuarioDetalleModal` o `DesactivarUsuarioModal` sin confirmar, el sistema NO DEBE ejecutar la mutación correspondiente ni alterar el estado visual del control que la disparó (`UsuarioCreadoModal` es la única excepción — REQ-S3, no tiene ruta de "cancelar" porque documenta un hecho ya consumado).

## Riesgos documentados

- **Restauración de usuario desactivado, transparente para el frontend (sin riesgo, documentado por completitud)**: si el email del alta coincide con un usuario previamente desactivado (`deletedAt IS NOT NULL`), el backend restaura ese registro en vez de crear uno nuevo (`usuarios-gestion.spec.md` REQ-E6) — la respuesta `201` es idéntica en ambos casos (mismo `UsuarioCreadoDTO`). El frontend no necesita, ni debe, distinguir esta rama: `UsuarioFormModal`/`UsuarioCreadoModal` se comportan igual sin importar si el backend creó o restauró el registro.

## Criterios de aceptación

Cada REQ de arriba DEBE tener al menos un test que:

1. Lo referencia por ID exacto en un comentario: `// spec:SPEC-011:REQ-<X>`
2. Falla si el requisito no se cumple
3. Se ejecuta en `npm test` sin configuración adicional

## Tests trazados

- `test/app/RequireRole.test.tsx` — valida REQ-U2, REQ-U3, REQ-X3 (renderiza `Outlet` con el rol correcto, redirige con otro rol, skeleton mientras carga, fail-closed ante error — mismo esqueleto de casos que `RequirePermission.test.tsx`)
- `test/features/usuarios/usuario.constants.test.ts` — valida REQ-U9, REQ-X4, REQ-X5
- `test/features/usuarios/useUsuarios.test.tsx` — valida REQ-U1, REQ-X1, REQ-X3
- `test/features/usuarios/useUsuario.test.tsx` — valida REQ-E1
- `test/features/usuarios/invalidateUsuarioQueries.test.ts` — valida REQ-E5
- `test/features/usuarios/UsuarioFormModal.test.tsx` — valida REQ-U5, REQ-E2, REQ-X4, REQ-X7
- `test/features/usuarios/UsuarioCreadoModal.test.tsx` — valida REQ-U7, REQ-S3
- `test/features/usuarios/UsuarioRolControl.test.tsx` — valida REQ-U6, REQ-E3, REQ-X5
- `test/features/usuarios/UsuarioDetalleModal.test.tsx` — valida REQ-E1, REQ-S2
- `test/features/usuarios/DesactivarUsuarioModal.test.tsx` — valida REQ-E4, REQ-S2, REQ-X6, REQ-X7
- `test/features/usuarios/UsuariosListPage.test.tsx` — valida REQ-U4, REQ-U10, REQ-X1, REQ-X2, REQ-X3
- `test/layouts/AppLayout/navConfig.test.ts` — valida REQ-U8 (estructura/filtrado por `soloRol`)
- `test/layouts/AppLayout/TenantChrome.test.tsx` — valida REQ-U8 (visibilidad del ítem "Usuarios" solo para `superadmin`)
- `test/app/router.test.tsx` — valida REQ-X3 (wiring real de `RequireRole role="superadmin"` sobre `/usuarios`)

## Auditoría

> Ref: **api-pos SPEC-008** (`auditoria.spec.md`), consumido por `usuarios-gestion.spec.md` (`SPEC-013`)

Sin eventos de auditoría propios del frontend. Los tres eventos del módulo ya se registran en el backend al completarse cada mutación — el frontend no ejecuta lógica adicional, solo dispara las peticiones correctas (mismo criterio que `SPEC-010`):

| Constante              | Cuándo se registra (backend)                                       |
| ----------------------- | -------------------------------------------------------------------- |
| `USUARIO_CREADO`        | Al completar `POST /api/v1/usuarios` (`UsuarioFormModal`, REQ-E2)   |
| `USUARIO_ROL_CAMBIADO`  | Al completar `PATCH /api/v1/usuarios/:id/rol` (`UsuarioRolControl`, REQ-E3) |
| `USUARIO_ACCESO_REVOCADO` | Al completar `DELETE /api/v1/usuarios/:id` (`DesactivarUsuarioModal`, REQ-E4) |

## Dependencias

- **Depende de**: SPEC-001 (Design System) — `Modal`, `Select`, `Badge`, tokens de `brand.css`/`tailwind.config.ts`.
- **Depende de**: SPEC-006 (Code Splitting) — la ruta `/usuarios` nace con `React.lazy()` por archivo propio, import directo (no vía barrel), mismo criterio que Categorías/Productos.
- **Depende de**: SPEC-007 (Permisos) — `RequireRole` (REQ-U2) reutiliza `usePermisos()`/`PermisosEfectivosUsuario.role` sin endpoint nuevo, pero introduce un guard distinto a `RequirePermission` (REQ-U3, no hay `modulo.usuarios` en el catálogo dinámico).
- **Depende de**: SPEC-008 (AppLayout) — extiende `navConfig.ts`/`TenantChrome.tsx` con el campo `soloRol` (REQ-U8), nuevo en `NavItemConfig`.
- **Depende de**: SPEC-009 (Productos) — establece el patrón `DataTable`/toolbar/`FilterPopover` que este módulo reutiliza (REQ-U1/U10), y el precedente `ProductoEstadoControl` (`Select`, REQ-U6).
- **Depende de**: SPEC-010 (Categorías) — establece el patrón de listado + modales sin rutas propias, `invalidate<Dominio>Queries`, `apply<Dominio>ApiError` de dos niveles, y el grupo "Configuración" del sidebar que este módulo reutiliza (REQ-U8).
- **Depende de**: `api-pos` SPEC-013 (`usuarios-gestion.spec.md`) — contrato completo de endpoints, DTOs, roles asignables y códigos de error que esta spec consume.
- **Bloquea**: ninguna feature todavía.
- **Riesgo documentado**: ver §Riesgos documentados — restauración de usuario desactivado, sin impacto en el frontend.

## Cambios

- v1.0.0 (2026-08-05): Versión inicial (`draft`). Documenta el módulo de Gestión de Usuarios del tenant (exclusivo `superadmin`): listado (`DataTable` genérico + toolbar de filtros, mismo patrón que `SPEC-009`/`SPEC-010`), crear/detalle en modales, superficie de escritura angosta (crear, cambiar rol, desactivar — sin edición de perfil, el backend no la expone), patrón nuevo "revelar una sola vez" para la contraseña temporal (`UsuarioCreadoModal`), autodesactivación bloqueada preventivamente en UI, nuevo guard `app/RequireRole` (gate por rol estático, distinto de `RequirePermission`/catálogo dinámico) y nuevo ítem "Usuarios" en el grupo "Configuración" del sidebar (`soloRol`, nuevo campo de `NavItemConfig`).
