# SPEC-010: Módulo de Categorías — CRUD en Modales, Jerarquía a 2 Niveles

## Metadata

- **ID**: SPEC-010
- **Dominio**: inventario
- **Versión**: 1.0.0
- **Estado**: active
- **Owner**: `Equipo Frontend POS-MX`
- **Creada**: 2026-08-05
- **Última revisión**: 2026-08-05

## Contexto

El backend (`api-pos`) expone el módulo completo de Categorías (`SPEC-020`, ver `src/docs/doc-api.md`): CRUD con jerarquía a 2 niveles (raíz + subcategorías, auto-referenciada por `padreId`), multi-tenant, soft delete, y cambio de estado con cascada opcional sobre subcategorías activas. Desde `SPEC-020` v1.1.0 el control de acceso migró de roles estáticos (`verificarRoles`) al catálogo dinámico de permisos (`SPEC-003`, `verificarPermiso`) — cambio de contrato documentado en `RESPUESTA-005-cambio-codigo-error-403-categorias.md` (backend-a-frontend).

El frontend ya consumía una porción de este módulo desde `SPEC-009` v1.4.0 (`features/categorias/`: selector + modales de registro rápido, `CategoriaQuickCreateModal`/`SubcategoriaQuickCreateModal`), pero solo como apoyo a los campos `categoriaId`/`subcategoriaId` de Productos — sin listado, edición, cambio de estado ni eliminación propios. Esta spec documenta el cierre de ese módulo: la vista de gestión completa.

Decisiones clave capturadas en conversación con el usuario (no sobre un wireframe interactivo previo, mismo criterio que `SPEC-009`):

1. **Crear/editar/detalle en modales, no páginas propias** — a diferencia de Productos (formulario extenso, tabs), el modelo `Categoria` tiene pocos campos (`nombre`, `descripcion`, `padreId`, `estado`); no ameritan rutas dedicadas (`/categorias/nuevo`, `/categorias/:id`). Todo el CRUD vive sobre una única ruta (`/categorias`).
2. **Listado plano, sin árbol/expand** — `components/DataTable` (genérico, `SPEC-009`) no soporta filas anidadas, y `GET /api/v1/categorias` devuelve una lista plana. Columnas reducidas a Nombre, Jerarquía (badge Raíz/Subcategoría) y Estado — sin columna de "Categoría padre" resuelta por nombre (ver §Riesgos).
3. **Cambio de estado con cascada resuelto de forma preventiva** — `CategoriaDetalleModal` ya carga `CategoriaDTO.subcategorias` (activas, vía `GET /:id`); esa misma data decide si hace falta el modal de confirmación de cascada, sin esperar a que el backend rechace primero con `409 ERR_CATEGORIA_CONFIRMACION_REQUERIDA`.
4. **Sidebar reorganizado** — nuevo grupo expandible "Configuración" (`SubMenu` de `react-pro-sidebar`) con "Categorías" como único sub-ítem por ahora. Es una agrupación puramente visual del frontend: no tiene relación con `modulo.configuracion` del backend (`SPEC-003`, exclusivo `superadmin`) — la ruta de Categorías sigue gateada por su propio `modulo.categorias`, visible según la matriz de 7 roles de `SPEC-020`.
5. **Migración de permisos dinámicos** — `CATEGORIA_ROLES_ESCRITURA` (array hardcodeado contra `data.role`) se retira, reemplazado por `CATEGORIA_ACCION` (`categorias.ver|crear|editar|cambiar_estado|eliminar`) + `puedeAccion()`. Resuelve el riesgo documentado en `SPEC-009` v1.4.0/v1.7.0 ("Categorías sigue pendiente" hasta que el backend confirmara la migración) — confirmado en `RESPUESTA-005`.

## Wireframes

Referencia (ASCII, síntesis de la conversación de diseño — mismo criterio que `SPEC-009` §Wireframes):

```
Listado — /categorias
┌────────────────────────────────────────────────────────────────────────┐
│ Categorías                                              [+ Agregar]    │
│ ┌───────────────────────────┐ ┌────────────┐                          │
│ │ Buscar...                 │ │ Filtros (1)│                          │
│ └───────────────────────────┘ └────────────┘                          │
├────────────────────────────────────────────────────────────────────────┤
│ Nombre              Jerarquía        Estado                          ⋮ │
│ ──────────────────────────────────────────────────────────────────── │
│ Pantalones           ● Raíz          ● Activo                        ⋮ │
│ Ropa Dama             ● Raíz          ● Activo                        ⋮ │
│  ↳ Blusas             ● Subcategoría  ● Activo                        ⋮ │
├────────────────────────────────────────────────────────────────────────┤
│                                                  ‹ 1 2 3 ›  20 / página │
└────────────────────────────────────────────────────────────────────────┘
  ↑ clic en fila abre CategoriaDetalleModal (no navega)
  ↑ orden entre raíz/subcategoría no garantizado por el backend — ver §Riesgos

CategoriaDetalleModal                    CategoriaFormModal (crear/editar)
┌──────────────────────────────┐         ┌──────────────────────────────┐
│ Ropa Dama                    │         │ Nueva categoría               │
│ [Activa ⏻]                   │         │ Nombre*  [____________]       │
│ Descripción...                │         │ Descripción [____________]    │
│ Subcategorías (1)              │         │ [ ] Es subcategoría de otra   │
│  · Blusas · Activo             │         │   Categoría padre [▾]         │
│ ─────────────────────────────  │         │            [Cancelar][Guardar]│
│         [Editar]   [Eliminar]  │         └──────────────────────────────┘
└──────────────────────────────┘
```

## Requisitos en formato EARS

### Ubiquitous (siempre aplica)

- **REQ-U1**: La ruta `/categorias` DEBE renderizar `CategoriasListPage`, consumiendo `GET /api/v1/categorias` vía `useCategorias()` (TanStack Query) con `q, estado, padreId, soloRaiz, page, limit` reflejados en el estado de filtros de la vista — mismo patrón de toolbar (buscador + popover de filtros con badge de cantidad) y `components/DataTable` genérico que `SPEC-009` estableció.
- **REQ-U2**: A diferencia de Productos, Categorías NO tiene rutas propias de creación ni detalle — crear, editar y ver detalle DEBEN resolverse en modales (`CategoriaFormModal`, `CategoriaDetalleModal`) montados sobre `CategoriasListPage`, nunca en `/categorias/nuevo` o `/categorias/:id` (decisión de producto explícita, §Contexto punto 1).
- **REQ-U3**: Las columnas del listado DEBEN limitarse a Nombre (con prefijo visual "↳" cuando `padreId != null`), Jerarquía (badge "Raíz"/"Subcategoría") y Estado (badge) — nunca todos los campos de `CategoriaResumenDTO`. El listado NO resuelve el nombre de la categoría padre por fila (`GET /api/v1/categorias` no lo incluye en el listado) — ver §Riesgos.
- **REQ-U4**: `CategoriaFormModal` DEBE ser un único componente para crear y editar (`mode: 'crear' | 'editar'`), con un `Switch` "Es subcategoría de otra categoría" que revela el `Select` de categoría padre (poblado únicamente con categorías raíz vía `useCategoriasSelector({ soloRaiz: true })`, excluyendo a la propia categoría en edición) — reutiliza `crearCategoriaSchema` para la validación de campos en ambos modos; el caso especial "mover a raíz" (`padreId: null`) en edición se arma a mano en el submit, fuera del resolver de RHF.
- **REQ-U5**: El switch "Es subcategoría de otra categoría" y el `Select` de categoría padre DEBEN deshabilitarse en modo edición cuando la categoría tenga subcategorías activas (`categoria.subcategorias.filter(sub => sub.estado === 'ACTIVO').length > 0`), con una nota explicando el motivo — refleja `SPEC-020` REQ-E5(a)/REQ-X10 (no se puede convertir en subcategoría, ni reasignarle padre, a una categoría que ya es padre de otras).
- **REQ-U6**: `CategoriaDetalleModal` DEBE mostrar, cuando la categoría consultada es raíz (`padreId === null`), el desglose completo de sus subcategorías (`CategoriaDTO.subcategorias`, ya incluido en la respuesta de `GET /:id`) con el badge de estado de cada una — estado vacío explícito ("Sin subcategorías") cuando el arreglo está vacío. Cuando la categoría es una subcategoría, DEBE mostrar el nombre de su categoría padre (resuelto vía `useCategoriasSelector({ soloRaiz: true })`, ya que `GET /:id` solo trae el `padreId` crudo).
- **REQ-U7**: El control de Estado (`CategoriaEstadoControl`) DEBE ser un `Switch` binario (Activo/Inactivo) — a diferencia de `ProductoEstadoControl` (`Select`, 4 estados posibles), `EstadoCategoria` de `SPEC-020` solo tiene 2 valores.
- **REQ-U8**: El sidebar DEBE agrupar el ítem "Categorías" bajo un grupo expandible "Configuración" (`SubMenu` de `react-pro-sidebar`; `navConfig.ts` gana el tipo `NavGroupConfig` y la función `isNavGroup`/`flattenNavItems`) — agrupación puramente visual del frontend, sin relación con `modulo.configuracion` del backend (`SPEC-003`, exclusivo `superadmin`); la ruta de Categorías sigue gateada por su propio `RequirePermission modulo="modulo.categorias"`. El grupo se expande por defecto si alguna de sus rutas hijas está activa, y se oculta por completo si, tras filtrar sus ítems por permiso, no queda ninguno visible.
- **REQ-U9**: Toda acción de escritura/lectura del módulo DEBE resolverse contra el catálogo dinámico de permisos vía `CATEGORIA_ACCION` (`categorias.ver|crear|editar|cambiar_estado|eliminar`) + `puedeAccion()` — nunca comparando `data.role` contra un array hardcodeado. Reemplaza `CATEGORIA_ROLES_ESCRITURA`, riesgo documentado en `SPEC-009` v1.4.0/v1.7.0 y resuelto en esta versión tras la confirmación de migración del backend (`RESPUESTA-005`).
- **REQ-U10**: Toda opción binaria del módulo (switch "Es subcategoría", `CategoriaEstadoControl`, filtro "Solo categorías raíz") DEBE usar `components/Switch` — nunca un `<input type="checkbox">` nativo, mismo criterio que `SPEC-009` REQ-U39.

### State-driven (mientras X)

- **REQ-S1**: Mientras `useCategorias()`/`useCategoria()` estén en `isLoading`, la vista/modal correspondiente DEBE mostrar un skeleton acotado — nunca un spinner genérico (mismo criterio `SPEC-009` REQ-S1).
- **REQ-S2**: Mientras la categoría en edición tenga subcategorías activas, el campo "Categoría padre" de `CategoriaFormModal` permanece deshabilitado (REQ-U5) durante toda la sesión de edición, incluso si el usuario alterna el switch.
- **REQ-S3**: Mientras el rol activo no tenga `categorias.cambiar_estado`, `CategoriaDetalleModal` DEBE mostrar el estado como badge de solo lectura (`EstadoCategoriaBadge`) en vez del `Switch` interactivo de `CategoriaEstadoControl`.
- **REQ-S4**: Mientras el filtro "Solo categorías raíz" esté activo, el filtro "Categoría padre" DEBE permanecer deshabilitado — ambos son mutuamente excluyentes en la práctica (una categoría raíz nunca tiene `padreId`).

### Event-driven (cuando X)

- **REQ-E1**: Cuando el usuario haga clic en una fila del listado, el sistema DEBE abrir `CategoriaDetalleModal` con el `id` de esa fila y disparar `GET /:id` — nunca reutilizar los datos ya presentes en la fila del listado (`CategoriaResumenDTO` no incluye `descripcion` ni `subcategorias`).
- **REQ-E2**: Cuando el usuario intente desactivar (`estado = INACTIVO`) una categoría raíz con subcategorías activas, el sistema DEBE mostrar un modal de confirmación de cascada indicando el conteo exacto de subcategorías afectadas (dato ya disponible en `CategoriaDTO.subcategorias`, sin petición adicional) antes de llamar `PATCH /:id/estado` con `confirmarCascada: true`. Si el backend igualmente rechaza con `409 ERR_CATEGORIA_CONFIRMACION_REQUERIDA` (carrera: otra sesión activó una subcategoría entre la carga del detalle y el clic), el sistema DEBE mostrarlo vía toast como cualquier otro error sin campo asociado (REQ-X5) — es una red de seguridad, no el camino esperado.
- **REQ-E3**: Cuando el usuario active el estado a cualquier valor que no dispare REQ-E2 (reactivar, o desactivar sin subcategorías activas), el cambio DEBE aplicarse de inmediato sin modal de confirmación.
- **REQ-E4**: Cuando el usuario haga clic en "Editar" dentro de `CategoriaDetalleModal`, el sistema DEBE cerrar ese modal y abrir `CategoriaFormModal` en modo edición con los datos ya cargados — nunca dos modales abiertos simultáneamente sobre la misma categoría.
- **REQ-E5**: Cuando el usuario haga clic en "Eliminar" (columna de acciones del listado, o dentro de `CategoriaDetalleModal`), el sistema DEBE mostrar `EliminarCategoriaModal` de confirmación, indicando que la acción no puede deshacerse desde el sistema, antes de llamar `DELETE /:id` — mismo criterio que `SPEC-009` REQ-E11 para Productos.
- **REQ-E6**: Cuando cualquier mutación de escritura (crear, actualizar, cambiar estado, eliminar) se complete con éxito, el sistema DEBE invalidar `['categorias']` en bloque (`invalidateCategoriaQueries`, predicate sobre el primer segmento del query key) — cubre selector, listado y detalle con una sola invalidación (CLAUDE.md §6), nunca depender solo de `staleTime`.
- **REQ-E7**: Cuando el usuario active el switch "Solo categorías raíz" en el popover de filtros, el sistema DEBE limpiar el filtro "Categoría padre" si tenía un valor (REQ-S4).

### Unwanted (si X entonces)

- **REQ-X1**: Si `GET /api/v1/categorias` falla (red/servidor), la vista NO DEBE renderizar `DataTable` — DEBE mostrar un bloque de error con mensaje y acción "Reintentar" (`refetch`), mismo criterio `SPEC-009` REQ-X1.
- **REQ-X2**: Si el total de categorías de la empresa es 0 sin ningún filtro aplicado, el sistema DEBE mostrar un estado vacío dedicado ("Aún no has registrado categorías" + botón "Agregar"); si hay filtros o búsqueda activos y el resultado es 0, DEBE mostrar un estado vacío distinto ("No se encontraron categorías con estos filtros" + botón "Limpiar") — mismo criterio `SPEC-009` REQ-X2/X3, nunca el mismo mensaje para ambos casos.
- **REQ-X3**: Si un usuario sin `categorias.ver` navega directo a `/categorias` (módulo inactivo para su rol/empresa/usuario), el sistema DEBE redirigir a `/no-autorizado` vía `RequirePermission modulo="modulo.categorias"` — no debe llegar a disparar `GET /api/v1/categorias` (mismo criterio `SPEC-009` REQ-X5, `enabled` de `useCategorias` condicionado a `puedeAccion(..., CATEGORIA_ACCION.VER)`).
- **REQ-X4**: Si una mutación de `CategoriaFormModal` falla con un código de negocio mapeable a un campo (`ERR_CATEGORIA_NOMBRE_DUPLICADO` → `nombre`; `ERR_CATEGORIA_PADRE_NOT_FOUND`/`ERR_CATEGORIA_JERARQUIA_EXCEDIDA`/`ERR_CATEGORIA_PADRE_INVALIDO` → `padreId`), el sistema DEBE resolver el campo vía `CATEGORIA_ERROR_CODE_TO_FIELD` y aplicar `setError` — mismo patrón de dos niveles (`error.details` de Zod vs. tabla estática) que `applyProductoApiError`, reutilizando el helper genérico `lib/applyApiError.ts`.
- **REQ-X5**: Si una mutación falla con un código sin campo de formulario asociado en su contexto (`ERR_CATEGORIA_CON_SUBCATEGORIAS_ACTIVAS`, `ERR_CATEGORIA_CON_PRODUCTOS_ASOCIADOS` al eliminar; `ERR_CATEGORIA_CONFIRMACION_REQUERIDA` en la red de seguridad de REQ-E2), el sistema DEBE mostrar un toast con `error.message` — nunca forzar un `setError` sin campo real al que anclarse.
- **REQ-X6**: Si el usuario cierra `CategoriaFormModal`, `CategoriaDetalleModal`, el modal de confirmación de cascada o `EliminarCategoriaModal` sin confirmar, el sistema NO DEBE ejecutar la mutación correspondiente ni alterar el estado visual del control que la disparó.

## Riesgos documentados

- **Orden del listado no garantizado (abierto)**: `GET /api/v1/categorias` no ordena las filas jerárquicamente — una subcategoría puede aparecer antes, o lejos, de su propia categoría raíz (orden alfabético plano observado). Reportado por el usuario durante pruebas manuales; se decidió **no** mitigar en el cliente (un reordenamiento por página sería "mejor esfuerzo" ante paginación server-side, y no se agregó columna de "Categoría padre" al listado — REQ-U3) y en su lugar pedir el orden correcto al backend. Ver `frontend-a-backend/PETICION-006-orden-jerarquico-listado-categorias.md`, estado *Pendiente* al momento de esta versión.

## Criterios de aceptación

Cada REQ de arriba DEBE tener al menos un test que:

1. Lo referencia por ID exacto en un comentario: `// spec:SPEC-010:REQ-<X>`
2. Falla si el requisito no se cumple
3. Se ejecuta en `npm test` sin configuración adicional

## Tests trazados

- `test/features/categorias/categoria.constants.test.ts` — valida REQ-U9, REQ-X4, REQ-X5
- `test/features/categorias/actualizarCategoria.schema.test.ts` — valida REQ-U4
- `test/features/categorias/invalidateCategoriaQueries.test.ts` — valida REQ-E6
- `test/features/categorias/useCategorias.test.tsx` — valida REQ-U1, REQ-X1, REQ-X3
- `test/features/categorias/useCategoria.test.tsx` — valida REQ-E1
- `test/features/categorias/CategoriaEstadoControl.test.tsx` — valida REQ-U7, REQ-S3, REQ-E2, REQ-E3, REQ-E6c, REQ-X6
- `test/features/categorias/CategoriaFormModal.test.tsx` — valida REQ-U4, REQ-U5, REQ-S2, REQ-X4
- `test/features/categorias/CategoriaDetalleModal.test.tsx` — valida REQ-U6, REQ-S1, REQ-E4, REQ-E5
- `test/features/categorias/CategoriasListPage.test.tsx` — valida REQ-U3, REQ-X1, REQ-X2, REQ-X3, REQ-E5
- `test/layouts/AppLayout/navConfig.test.ts` — valida REQ-U8 (`isNavGroup`/`flattenNavItems`, estructura de `TENANT_NAV`)
- `test/layouts/AppLayout/TenantChrome.test.tsx` — valida REQ-U8 (visibilidad/ocultamiento del grupo "Configuración")
- `test/app/router.test.tsx` — valida REQ-X3 (wiring real de `RequirePermission modulo="modulo.categorias"`)

## Auditoría

> Ref: **api-pos SPEC-008** (`auditoria.spec.md`)

Sin eventos de auditoría propios del frontend. Los cuatro eventos del módulo ya se registran en el backend vía `registrarAuditoria` (`categorias.routes.ts`, `SPEC-020` §Auditoría) al completarse cada mutación — el frontend no ejecuta lógica adicional, solo dispara las peticiones correctas:

| Constante                | Cuándo se registra (backend)                                  |
| ------------------------- | --------------------------------------------------------------- |
| `CATEGORIA_CREATED`       | Al completar `POST /api/v1/categorias` (`CategoriaFormModal`, modo crear) |
| `CATEGORIA_UPDATED`       | Al completar `PATCH /api/v1/categorias/:id` (`CategoriaFormModal`, modo editar) |
| `CATEGORIA_ESTADO_CHANGED`| Al completar `PATCH /api/v1/categorias/:id/estado` (REQ-E2/E3) |
| `CATEGORIA_DELETED`       | Al completar `DELETE /api/v1/categorias/:id` (REQ-E5)          |

## Dependencias

- **Depende de**: SPEC-001 (Design System) — `Modal`, `Switch`, `Select`, `Badge`, tokens de `brand.css`/`tailwind.config.ts`.
- **Depende de**: SPEC-006 (Code Splitting) — la ruta `/categorias` nace con `React.lazy()` por archivo propio, import directo (no vía barrel), mismo criterio que Productos.
- **Depende de**: SPEC-007 (Permisos) — `RequirePermission modulo="modulo.categorias"` gatea la ruta completa; `puedeAccion(data, CATEGORIA_ACCION.<clave>)` gatea lectura y cada acción de escritura (REQ-U9).
- **Depende de**: SPEC-008 (AppLayout) — la vista vive dentro del shell; esta spec extiende el propio sidebar de esa spec con el grupo "Configuración" (REQ-U8).
- **Depende de**: SPEC-009 (Productos) — establece el patrón `DataTable` genérico + toolbar de filtros que este módulo reutiliza (REQ-U1); además, `SPEC-009` REQ-U49–U52 ya consumía `features/categorias/` parcialmente (selector + registro rápido) antes de esta spec — `CategoriaSelect`/`SubcategoriaSelect` de Productos siguen consumiendo el mismo barrel sin cambios.
- **Depende de**: `api-pos` SPEC-020 (Módulo de Categorías, v1.1.0) — contrato completo de endpoints, DTOs, reglas de jerarquía y permisos dinámicos que esta spec consume.
- **Depende de**: `api-pos` SPEC-003 (Autorización — Permisos por Módulo y Acción) — catálogo dinámico que resuelve `CATEGORIA_ACCION`; `categorias` está exento del gate de plan (no encadena `verificarSuscripcion`).
- **Bloquea**: ninguna feature todavía. Cualquier cambio de forma de datos en `features/categorias/` (barrel) debe revisarse contra `SPEC-009` (Productos sigue siendo consumidor externo vía `CategoriaSelect`/`SubcategoriaSelect`).
- **Riesgo documentado**: ver §Riesgos documentados — orden jerárquico del listado pendiente de `PETICION-006`.

## Cambios

- v1.0.0 (2026-08-05): Versión inicial. Documenta el módulo completo de gestión de Categorías: listado (`DataTable` genérico + toolbar de filtros, mismo patrón que `SPEC-009`), crear/editar/detalle resueltos en modales (decisión de producto, sin rutas propias), cambio de estado binario con confirmación preventiva de cascada usando datos ya cargados del detalle, eliminación con confirmación, permisos dinámicos vía `CATEGORIA_ACCION` (reemplaza `CATEGORIA_ROLES_ESCRITURA`, resolviendo el riesgo abierto desde `SPEC-009` v1.4.0/v1.7.0), y nuevo grupo "Configuración" en el sidebar (`NavGroupConfig`, `SubMenu`). Construido sobre la base parcial ya existente desde `SPEC-009` v1.4.0 (selector + registro rápido, consumidos por Productos). Riesgo abierto: orden jerárquico del listado pendiente de respuesta de backend (`PETICION-006`).
