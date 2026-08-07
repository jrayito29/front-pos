# SPEC-012: Módulo de Sucursales y Almacenes

## Metadata

- **ID**: SPEC-012
- **Dominio**: config
- **Versión**: 1.0.0
- **Estado**: active
- **Owner**: `Equipo Frontend POS-MX`
- **Creada**: 2026-08-06
- **Última revisión**: 2026-08-06

## Contexto

El backend (`api-pos`) expone el módulo completo de Sucursales y Almacenes (`SPEC-014`, ver `src/docs/doc-api.md`): dos entidades con responsabilidades distintas — Sucursal es la unidad comercial/administrativa (punto de venta, con dirección propia), Almacén es la unidad logística que siempre vive dentro de una sucursal. Al crear una sucursal, el backend genera automáticamente en una sola transacción los almacenes estándar (`VENTAS`, `MERMAS`, `TRANSITO` obligatorios; `RESERVA`, `APARTADOS` opcionales vía flags) y bloquea las implementaciones de Inventario/Stock, Ventas y Traspasos, que dependen de los modelos aquí definidos. Es el primer módulo de infraestructura logística del frontend.

Decisiones clave capturadas en conversación con el usuario (mismo criterio que `SPEC-009`/`SPEC-010`: no hay wireframe interactivo previo, la síntesis de `§Wireframes` es la conversación misma):

1. **Crear/editar Sucursal en páginas propias, no modales** — a diferencia de Categorías (pocos campos), Sucursal combina datos generales, una dirección completa (7 campos) y la configuración de almacenes a crear; amerita rutas dedicadas (`/sucursales/nuevo`, `/sucursales/:id`), mismo patrón que Productos (`SPEC-009` REQ-U19/U23): Ver y Editar comparten ruta y componente, alternando modo con el botón "Editar".
2. **Almacenes se gestionan anidados en el detalle de la Sucursal, sin ruta propia** — el backend no expone un listado global de almacenes (`GET /sucursales/:sucursalId/almacenes` siempre requiere una sucursal en la ruta); una tab "Almacenes" dentro de `SucursalDetallePage` (mismo componente `Tabs` que Productos) resuelve edición, cambio de estado y alta de almacenes personalizados sin necesidad de una vista de nivel superior.
3. **Sucursales vive bajo el grupo "Configuración" del sidebar** — junto a Categorías (`SPEC-010`), no como ítem de nivel raíz.
4. **Hallazgo de inconsistencia resuelto**: `navConfig.ts`/`router.tsx` ya tenían un ítem raíz "Almacenes" (`ROUTES.ALMACENES = '/almacenes'`, gate `modulo.almacenes`) apuntando a un `RouteStub` sin implementar, sembrado antes de este spec. Como el backend no soporta un listado global de almacenes (punto 2), se decidió **retirar ese ítem y su ruta stub** en vez de construir la página que prometía — toda la gestión de almacenes queda exclusivamente dentro del detalle de cada sucursal (REQ-U11).

## Wireframes

Referencia (ASCII, síntesis de la conversación de diseño — mismo criterio que `SPEC-009`/`SPEC-010` §Wireframes):

```
Listado — /sucursales
┌────────────────────────────────────────────────────────────────────────┐
│ Sucursales                                              [+ Agregar]    │
│ ┌───────────────────────────┐ ┌────────────┐                          │
│ │ Buscar...                 │ │ Filtros (1)│                          │
│ └───────────────────────────┘ └────────────┘                          │
├────────────────────────────────────────────────────────────────────────┤
│ Nombre               Código      Ubicación              Estado       ⋮│
│ ──────────────────────────────────────────────────────────────────── │
│ Sucursal Centro       SUC-0001    Monterrey, NL          ● Activo     │
│ Sucursal Norte        SUC-0002    San Nicolás, NL         ● Activo     │
├────────────────────────────────────────────────────────────────────────┤
│                                                  ‹ 1 2 ›  20 / página   │
└────────────────────────────────────────────────────────────────────────┘
  ↑ clic en fila navega a /sucursales/:id (nunca modal)
  ↑ columna "Estado" = `activo` (boolean) — no confundir con el campo de
    dirección `estado` (entidad federativa), solo visible en Ubicación/formularios

Crear — /sucursales/nuevo (formulario en blanco, sin tabs)
┌────────────────────────────────────────────────────────────────────────┐
│ Nueva sucursal                                                          │
│ ── Datos generales ──────────────────────────────────────────────────  │
│ Nombre*        [_______________________]                               │
│ Código         [SUC-] [______] (opcional, sufijo libre)                 │
│ Teléfono       [_______________________]  Email [_____________]        │
│ ── Dirección ────────────────────────────────────────────────────────  │
│ Calle* [______________]  Núm. ext.* [____]  Núm. int. [____]           │
│ Colonia* [____________]  Municipio* [__________]  Estado* [_________]  │
│ Código postal* [_____]                                                  │
│ Dirección completa (auto): "Calle Núm, Col. Colonia, Municipio, ..."   │
│ ── Almacenes que se crearán ───────────────────────────────────────── │
│ [✓] Almacén de Ventas          — siempre se crea                       │
│ [✓] Almacén de Mermas          — siempre se crea                       │
│ [✓] Almacén de Tránsito        — siempre se crea                       │
│ [ ] Bodega de Reserva          — opcional                              │
│ [ ] Almacén de Apartados       — opcional                              │
│                                                    [Cancelar] [Guardar] │
└────────────────────────────────────────────────────────────────────────┘

Detalle — /sucursales/:id
┌────────────────────────────────────────────────────────────────────────┐
│ Sucursal Centro · SUC-0001                    [Activa ⏻] [Editar]      │
│ ┌ Información general ┐ ┌ Almacenes (5) ┐                              │
│ └──────────────────────┘                                               │
├────────────────────────────────────────────────────────────────────────┤
│ (tab Información general = SucursalInfoGeneralReadOnly/Form, igual     │
│  que ProductoInfoGeneralTab: alterna con el botón "Editar" del header) │
│                                                                          │
│ (tab Almacenes)                                                        │
│ ┌────────────────────────────────────────────────────────┐[+ Agregar] │
│ │ Buscar...        │ │ Filtros │                          │           │
│ ├────────────────────────────────────────────────────────┤           │
│ │ Nombre              Tipo        Config          Estado ⋮│           │
│ │ Almacén de Ventas   Ventas      Venta·Traspaso   ● Activo⋮│         │
│ │ Bodega de Reserva   Reserva     —                ● Activo⋮│         │
│ └────────────────────────────────────────────────────────┘           │
└────────────────────────────────────────────────────────────────────────┘
  ↑ clic en fila de Almacenes abre AlmacenFormModal (editar), nunca navega
  ↑ "+ Agregar" abre AlmacenFormModal en modo crear (tipo fijo Personalizado)
```

## Requisitos en formato EARS

### Ubiquitous (siempre aplica)

- **REQ-U1**: La ruta `/sucursales` DEBE renderizar `SucursalesListPage`, consumiendo `GET /api/v1/sucursales` vía `useSucursales()` con `q, activo, page, limit` reflejados en el estado de filtros — mismo patrón toolbar (buscador + popover de filtros) y `components/DataTable` genérico que `SPEC-009`/`SPEC-010`.
- **REQ-U2**: A diferencia de Categorías, crear y ver/editar Sucursal DEBEN vivir en rutas propias (`/sucursales/nuevo`, `/sucursales/:id`) — nunca modales — dado el volumen de campos (datos generales + dirección de 7 campos + configuración de almacenes al crear). Mismo patrón que Productos (`SPEC-009` REQ-U19/U23).
- **REQ-U3**: `GET /api/v1/sucursales` (backend, `listarSucursalesService`) devuelve `SucursalDTO[]` completo — mismo shape que el detalle (`telefono`, `email`, dirección completa, timestamps incluidos; sin `almacenes`, exclusivo de `GET /:id`) — no existe un DTO reducido para Sucursal, a diferencia de `CategoriaResumenDTO`. Aun así, las columnas del listado DEBEN limitarse a Nombre, Código (`codigoPersonalizable` si existe, si no `codigoInterno`), Ubicación (`municipio`, `estado`) y Estado (badge de `activo`) — es una decisión de presentación, no una limitación de datos; el resto de campos de `SucursalDTO` solo se muestran en el detalle. La columna "Estado" refleja siempre el booleano `activo`; el campo de dirección `estado` (entidad federativa) solo aparece dentro de "Ubicación" o de la sección Dirección de los formularios, nunca bajo el mismo encabezado que pueda confundirse con el estado activo/inactivo.
- **REQ-U4**: El campo `codigoPersonalizable` de Sucursal (opcional) DEBE capturarse con un prefijo visual fijo "SUC-" (adornment no editable del `Input`, mismo criterio `input-helper-text`) — el usuario solo escribe el sufijo; el valor final enviado al backend (`"SUC-" + sufijo`) se arma en el submit del formulario, nunca se le exige al usuario escribir o recordar el prefijo que exige el regex del backend (`crearSucursalSchema` en `api-pos`).
- **REQ-U5**: El campo `direccionCompleta` de `SucursalCrearForm` es un input editable por el usuario (override opcional en `crearSucursalSchema`). Por defecto se ofrece como sugerencia clickeable el valor calculado en cada render a partir de `calle, numeroExterior, numeroInterior, colonia, municipio, estado, codigoPostal` con un formateador puro (`buildDireccionCompleta()`) — mismo patrón "campo editable + sugerencia" que `ProductoIdentificacionFields`/`ProductoCostosFields` (`nombreCorto`/`precioVenta`). Si el usuario deja el campo vacío, el submit usa el valor calculado como fallback; si lo reescribe, ese valor es el que viaja en el payload de `POST /sucursales`. `SucursalInfoGeneralForm` (editar) conserva el criterio previo: `direccionCompleta` se muestra como texto de solo lectura y no es editable ahí.
- **REQ-U6**: `SucursalDetallePage` DEBE seguir el mismo patrón que `ProductoDetallePage` (`SPEC-009` REQ-U23 a U34): una sola ruta `/sucursales/:id`, un botón "Editar" en el header alterna entre `SucursalInfoGeneralReadOnly` y `SucursalInfoGeneralForm` dentro de la tab "Información general" — nunca una ruta o modal propios para editar.
- **REQ-U7**: La tab "Almacenes" del detalle de Sucursal DEBE consumir `GET /sucursales/:sucursalId/almacenes` (paginado, filtros `q, activo, tipo`) vía `useAlmacenesDeSucursal()` + `DataTable` genérico — independiente del arreglo `almacenes` embebido en `SucursalConAlmacenesDTO` (ese arreglo solo trae almacenes activos y no pagina; se usa únicamente para el badge de conteo "Almacenes (N)" del header de tabs, nunca como fuente de la tabla).
- **REQ-U8**: El formulario de creación de Sucursal DEBE mostrar la sección "Almacenes que se crearán" con 5 filas: Ventas, Mermas y Tránsito como `Switch` fijos en `true` y deshabilitados (nota "Siempre se crea"); Reserva y Apartados como `Switch` editables en `false` por defecto, mapeando a `almacenesOpcionales.incluirReserva`/`incluirApartados` del payload de `POST /sucursales`.
- **REQ-U9**: Toda acción de lectura/escritura sobre Sucursal DEBE resolverse vía `SUCURSAL_ACCION` (`sucursales.ver|crear|editar|cambiar_estado`) + `puedeAccion()`; toda acción sobre Almacenes (tab, modal, cambio de estado) DEBE resolverse vía `ALMACEN_ACCION` (`almacenes.ver|crear|editar|cambiar_estado`) — dos catálogos de permisos independientes, reflejando que el backend los da de alta como dos módulos separados (`SPEC-014` §Roles por Operación) aunque compartan hoy la misma matriz de roles. Nunca comparar `data.role`.
- **REQ-U10**: Toda opción binaria del módulo (Reserva/Apartados al crear sucursal, `permitirVenta`/`permitirTraspaso`/`esVirtual` de almacén, estado activo/inactivo) DEBE usar `components/Switch` — nunca `<input type="checkbox">` nativo (mismo criterio `SPEC-010` REQ-U10).
- **REQ-U11**: El sidebar DEBE agregar "Sucursales" (`ROUTES.SUCURSALES`, gate `modulo.sucursales`) como sub-ítem del grupo "Configuración" (`navConfig.ts`, ya creado en `SPEC-010`), junto a Categorías, reutilizando `AlmacenesIcon` (sin crear un ícono nuevo). El ítem raíz "Almacenes" (`ROUTES.ALMACENES`, `RouteStub`, gate `modulo.almacenes`) y su `<Route>` correspondiente en `router.tsx` DEBEN retirarse — ver §Contexto punto 4.

### State-driven (mientras X)

- **REQ-S1**: Mientras `useSucursales()`/`useSucursal()`/`useAlmacenesDeSucursal()` estén en `isLoading`, la vista/tab correspondiente DEBE mostrar un skeleton acotado — nunca un spinner genérico (mismo criterio `SPEC-009` REQ-S1).
- **REQ-S2**: Mientras el rol activo no tenga `sucursales.cambiar_estado`, el detalle DEBE mostrar el estado como badge de solo lectura en vez de `SucursalEstadoControl` interactivo (mismo criterio `CategoriaEstadoControl`).
- **REQ-S3**: Mientras el rol activo no tenga `almacenes.cambiar_estado`, cada fila de la tab Almacenes DEBE mostrar un badge de solo lectura en vez de `AlmacenEstadoControl` interactivo.
- **REQ-S4**: Mientras una sucursal tenga `activo = false`, el botón "+ Agregar almacén" de la tab Almacenes DEBE permanecer deshabilitado con un tooltip explicando el motivo (refleja `SPEC-014` REQ-S3 del backend, `ERR_SUCURSAL_INACTIVA`) — evita un viaje de red que el backend rechazará de antemano.
- **REQ-S5**: Mientras el rol activo no tenga `almacenes.ver`, la tab "Almacenes" NO DEBE aparecer en la lista de tabs del detalle de sucursal, y `GET /sucursales/:sucursalId/almacenes` no debe dispararse — mismo criterio de `RequirePermission` a nivel de ruta, aplicado aquí a un tab.

### Event-driven (cuando X)

- **REQ-E1**: Cuando el usuario haga clic en una fila del listado, el sistema DEBE navegar a `/sucursales/:id` (nunca abrir un modal).
- **REQ-E2**: Cuando el usuario haga clic en "Editar" dentro del header de `SucursalDetallePage`, el sistema DEBE alternar `isEditing` a `true`, mostrando `SucursalInfoGeneralForm` en la tab activa.
- **REQ-E3**: Cuando `SucursalInfoGeneralForm` guarde exitosamente, el sistema DEBE volver a `isEditing = false` e invalidar `['sucursales']` (REQ-E9).
- **REQ-E4**: Cuando `SucursalEstadoControl` envíe `PATCH /:id/estado` con `activo: false` y el backend responda `data.requiereConfirmacion === true`, el sistema DEBE abrir un modal listando `almacenesConStock` (nombre + `codigoInterno`) con un botón "Confirmar y desactivar" que reenvía `{ activo: false, confirmarConStock: true }`. Si `requiereConfirmacion` es falso/ausente, la desactivación se aplica de inmediato sin modal.
- **REQ-E5**: Cuando el usuario reactive una sucursal (`activo: true`), el cambio DEBE aplicarse de inmediato, sin modal de confirmación (el backend nunca pide confirmación para reactivar).
- **REQ-E6**: Cuando el usuario haga clic en una fila de la tabla Almacenes, el sistema DEBE abrir `AlmacenFormModal` en modo editar, precargado con los datos de esa fila.
- **REQ-E7**: Cuando el usuario haga clic en "+ Agregar almacén", el sistema DEBE abrir `AlmacenFormModal` en modo crear, con `tipo` fijo en `PERSONALIZADO` (no seleccionable — es el único tipo creable manualmente, `SPEC-014` REQ-E6) y la sección Dirección colapsada por defecto con la nota "Si no la completas, se usará la dirección de la sucursal" (refleja `SPEC-014` REQ-E8).
- **REQ-E8**: Cuando `AlmacenEstadoControl` envíe `PATCH /almacenes/:id/estado` con `activo: false` y el backend responda `409 ERR_ALMACEN_CON_STOCK`, el sistema DEBE mostrarlo vía toast — a diferencia de Sucursal (REQ-E4), no hay modal de confirmación previa porque el backend no expone el stock de un almacén individual antes del intento.
- **REQ-E9**: Cuando cualquier mutación de escritura del módulo (crear/editar sucursal, cambiar estado de sucursal, crear/editar/cambiar estado de almacén) se complete con éxito, el sistema DEBE invalidar `['sucursales']` en bloque (`invalidateSucursalQueries`, predicate sobre el primer segmento del query key) — cubre listado, detalle y tabla de almacenes de esa sucursal con una sola invalidación (CLAUDE.md §6).
- **REQ-E10**: La sugerencia de `direccionCompleta` (REQ-U5) DEBE recalcularse ante cualquier cambio de los 7 campos de dirección que lo componen — el usuario decide si la usa (botón "usar") o mantiene su propio texto; el campo del formulario nunca se sobreescribe automáticamente mientras el usuario lo esté editando.

### Unwanted (si X entonces)

- **REQ-X1**: Si `GET /api/v1/sucursales` falla (red/servidor), la vista NO DEBE renderizar `DataTable` — DEBE mostrar un bloque de error con "Reintentar" (`refetch`), mismo criterio `SPEC-009` REQ-X1.
- **REQ-X2**: Si el total de sucursales de la empresa es 0 sin filtros aplicados, el sistema DEBE mostrar un estado vacío dedicado ("Aún no has registrado sucursales" + botón "Agregar"); si hay filtros/búsqueda activos y el resultado es 0, DEBE mostrar un estado vacío distinto ("No se encontraron sucursales con estos filtros" + botón "Limpiar").
- **REQ-X3**: Si un usuario sin `sucursales.ver` navega directo a `/sucursales` o `/sucursales/:id`, el sistema DEBE redirigir a `/no-autorizado` vía `RequirePermission modulo="modulo.sucursales"` — no debe llegar a disparar la petición correspondiente (`enabled` condicionado a `puedeAccion(..., SUCURSAL_ACCION.VER)`).
- **REQ-X4**: Si una mutación de `SucursalCrearForm`/`SucursalInfoGeneralForm` falla con un código mapeable a un campo (`ERR_SUCURSAL_CODIGO_DUPLICADO`/`ERR_SUCURSAL_CODIGO_PREFIJO_INVALIDO` → `codigoPersonalizable`), el sistema DEBE resolver el campo vía `SUCURSAL_ERROR_CODE_TO_FIELD` y aplicar `setError` (reutilizando `lib/applyApiError.ts`, mismo patrón que Categorías/Productos); códigos sin campo asociado (`ERR_SUCURSAL_NOT_FOUND`, `ERR_SUCURSAL_INACTIVA`) DEBEN mostrarse vía toast.
- **REQ-X5**: Si una mutación de `AlmacenFormModal` falla con `ERR_ALMACEN_CODIGO_DUPLICADO` → `setError(codigoPersonalizable)`; `ERR_ALMACEN_TIPO_DUPLICADO`/`ERR_ALMACEN_NOT_FOUND` DEBEN mostrarse vía toast (red de seguridad: no deberían ocurrir en el flujo normal, ya que el frontend siempre crea almacenes personalizados con `tipo: PERSONALIZADO`, que no está sujeto a unicidad por tipo).
- **REQ-X6**: Si el usuario cierra `AlmacenFormModal` o el modal de confirmación de stock (REQ-E4) sin confirmar, el sistema NO DEBE ejecutar la mutación correspondiente ni alterar el estado visual del control que la disparó.
- **REQ-X7**: Si `limit` supera 100 en cualquier listado del módulo (sucursales o almacenes de una sucursal), el sistema NO DEBE construir ese request — `DataTable`/`paginationRowsPerPageOptions` tope en 100, mismo criterio que Productos/Categorías.
- **REQ-X8**: Si el `id` de sucursal en la URL no corresponde a una sucursal existente o de otra empresa (`404`/`ERR_SUCURSAL_NOT_FOUND`), `SucursalDetallePage` DEBE mostrar un `EmptyState` ("Sucursal no encontrada" + botón "Volver") — nunca un formulario vacío (mismo criterio `ProductoDetallePage` REQ-X4).

## Riesgos documentados

- **Flujo de confirmación por stock no verificable end-to-end todavía**: `SPEC-014` §Flujo de Desactivación documenta que `almacenesConStock` retornará siempre vacío hasta que el módulo de Inventario/Stock exista en el backend. REQ-E4 se implementa igual (contrato ya definido), pero solo puede probarse con mocks hasta entonces — no hay forma de disparar el camino real con datos de stock reales en este spec.
- **Posible duplicación de la sección Dirección con `SPEC-004` (`StepDomicilio`/`completarPerfilSchema`)**: mismo grupo de campos (`calle, numeroExterior, numeroInterior, colonia, estado, codigoPostal`) pero forma distinta — `SPEC-004` usa `ciudad` (no `municipio`), todos los campos son opcionales y no incluye `direccionCompleta`. No se extrae un componente `DireccionFields` compartido en esta versión por esa divergencia de forma; revisar si conviene unificarlos si aparece un tercer consumidor con la misma forma exacta.

## Criterios de aceptación

Cada REQ de arriba DEBE tener al menos un test que:

1. Lo referencia por ID exacto en un comentario: `// spec:SPEC-012:REQ-<X>`
2. Falla si el requisito no se cumple
3. Se ejecuta en `npm test` sin configuración adicional

## Tests trazados

- `test/features/sucursales/sucursal.constants.test.ts` — valida REQ-U9, REQ-X4, REQ-X5
- `test/features/sucursales/buildDireccionCompleta.test.ts` — valida REQ-U5, REQ-E10
- `test/features/sucursales/crearSucursal.schema.test.ts` — valida REQ-U4
- `test/features/sucursales/invalidateSucursalQueries.test.ts` — valida REQ-E9
- `test/features/sucursales/useSucursales.test.tsx` — valida REQ-U1, REQ-X1, REQ-X3
- `test/features/sucursales/useSucursal.test.tsx` — valida REQ-E1, REQ-X8
- `test/features/sucursales/useAlmacenesDeSucursal.test.tsx` — valida REQ-U7, REQ-S5
- `test/features/sucursales/SucursalEstadoControl.test.tsx` — valida REQ-E4, REQ-E5, REQ-S2, REQ-X6
- `test/features/sucursales/AlmacenEstadoControl.test.tsx` — valida REQ-E8, REQ-S3
- `test/features/sucursales/AlmacenFormModal.test.tsx` — valida REQ-E6, REQ-E7, REQ-X5, REQ-X6
- `test/features/sucursales/SucursalCrearForm.test.tsx` — valida REQ-U8, REQ-U4, REQ-U5, REQ-X4
- `test/features/sucursales/SucursalDetallePage.test.tsx` — valida REQ-U6, REQ-U7, REQ-S1, REQ-S4, REQ-X3, REQ-X8
- `test/features/sucursales/SucursalesListPage.test.tsx` — valida REQ-U3, REQ-X1, REQ-X2, REQ-X3, REQ-E1
- `test/layouts/AppLayout/navConfig.test.ts` — valida REQ-U11 (nuevo sub-ítem "Sucursales", retiro del ítem raíz "Almacenes")
- `test/app/router.test.tsx` — valida REQ-X3, REQ-U11 (retiro de la ruta stub `/almacenes`)

## Auditoría

> Ref: **api-pos SPEC-008** (`auditoria.spec.md`)

Sin eventos de auditoría propios del frontend. Los ocho eventos del módulo ya se registran en el backend vía `registrarAuditoria` (`sucursales.routes.ts`/`almacenes.routes.ts`, `SPEC-014` §Auditoría) al completarse cada mutación — el frontend no ejecuta lógica adicional, solo dispara las peticiones correctas:

| Constante              | Cuándo se registra (backend)                                           |
| ---------------------- | ---------------------------------------------------------------------- |
| `SUCURSAL_CREATED`     | Al completar `POST /api/v1/sucursales` (`SucursalCrearForm`)           |
| `SUCURSAL_UPDATED`     | Al completar `PATCH /api/v1/sucursales/:id` (REQ-E3)                   |
| `SUCURSAL_DESACTIVADA` | Al completar `PATCH /api/v1/sucursales/:id/estado` con `activo: false` |
| `SUCURSAL_ACTIVADA`    | Al completar `PATCH /api/v1/sucursales/:id/estado` con `activo: true`  |
| `ALMACEN_CREATED`      | Al completar `POST /api/v1/sucursales/:sucursalId/almacenes` (REQ-E7)  |
| `ALMACEN_UPDATED`      | Al completar `PATCH /api/v1/almacenes/:id` (REQ-E6)                    |
| `ALMACEN_DESACTIVADO`  | Al completar `PATCH /api/v1/almacenes/:id/estado` con `activo: false`  |
| `ALMACEN_ACTIVADO`     | Al completar `PATCH /api/v1/almacenes/:id/estado` con `activo: true`   |

## Dependencias

- **Depende de**: SPEC-001 (Design System) — `Modal`, `Switch`, `Tabs`, `Input`, `Badge`, tokens de `tailwind.config.ts`.
- **Depende de**: SPEC-006 (Code Splitting) — las rutas `/sucursales`, `/sucursales/nuevo`, `/sucursales/:id` nacen con `React.lazy()` por archivo propio, mismo criterio que Productos.
- **Depende de**: SPEC-007 (Permisos) — `RequirePermission modulo="modulo.sucursales"` gatea la ruta completa; `puedeAccion(data, SUCURSAL_ACCION.<clave>)`/`ALMACEN_ACCION.<clave>` gatean lectura y cada acción de escritura (REQ-U9).
- **Depende de**: SPEC-008 (AppLayout) — la vista vive dentro del shell.
- **Depende de**: SPEC-009 (Productos) — establece el patrón página propia + `Tabs` + botón "Editar" alternando modo lectura/edición (REQ-U2/U6) y el `DataTable` genérico que este módulo reutiliza (REQ-U1/U7).
- **Depende de**: SPEC-010 (Categorías) — establece el grupo "Configuración" del sidebar (`NavGroupConfig`) donde se agrega "Sucursales" (REQ-U11), y el patrón de confirmación con `Modal` (`CategoriaEstadoControl`) que inspira `SucursalEstadoControl` (REQ-E4).
- **Depende de**: `api-pos` SPEC-014 (Módulo de Sucursales y Almacenes) — contrato completo de endpoints, DTOs, reglas de negocio (transacción de alta, flujo de desactivación con confirmación, unicidad de tipo por sucursal) y permisos dinámicos que esta spec consume.
- **Depende de**: `api-pos` SPEC-003 (Autorización — Permisos por Módulo y Acción) — catálogo dinámico que resuelve `SUCURSAL_ACCION`/`ALMACEN_ACCION`; ambos módulos exentos del gate de plan.
- **Depende de**: `api-pos` SPEC-011 (Consecutivos) — origen de `codigoInterno` (`SUC-####`/`ALM-####`), inmutable, sin lógica de generación en el frontend.
- **Bloquea**: SPEC-Inventario/Stock, SPEC-Ventas y SPEC-Traspasos del frontend (requieren selectores de `sucursalId`/`almacenId` que este módulo expone).
- **Riesgo documentado**: ver §Riesgos documentados — forma de `GET /sucursales` (listado) y verificación end-to-end del flujo de stock pendientes.

## Cambios

- v1.0.0 (2026-08-06): Versión inicial. Documenta el módulo completo de gestión de Sucursales y Almacenes: listado + alta/edición de Sucursal en páginas propias (patrón Productos, no modales — decisión de producto dado el volumen de campos), gestión de Almacenes anidada en una tab del detalle de Sucursal (sin ruta propia, ya que el backend no expone listado global de almacenes), `direccionCompleta` como campo derivado calculado en cliente, prefijo visual fijo "SUC-" para `codigoPersonalizable`, flujo de desactivación de dos pasos con confirmación por stock (Sucursal) vs. manejo directo de `ERR_ALMACEN_CON_STOCK` vía toast (Almacén individual), permisos dinámicos vía dos catálogos independientes (`SUCURSAL_ACCION`/`ALMACEN_ACCION`), y nuevo sub-ítem "Sucursales" en el grupo "Configuración" del sidebar — reemplaza y retira el ítem raíz "Almacenes" (`RouteStub` sin implementar, sembrado antes de este spec) que asumía incorrectamente un listado global de almacenes. Riesgo abierto: flujo de confirmación por stock no verificable end-to-end hasta que exista SPEC-Inventario.
