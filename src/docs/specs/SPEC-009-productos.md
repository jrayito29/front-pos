# SPEC-009: Módulo de Productos — `DataTable` Genérico, Listado, Alta y Ver/Editar

## Metadata

- **ID**: SPEC-009
- **Dominio**: inventario
- **Versión**: 1.3.0
- **Estado**: draft
- **Owner**: `Equipo Frontend POS-MX`
- **Creada**: 2026-08-04
- **Última revisión**: 2026-08-04

## Contexto

El backend (`api-pos`) expone el módulo de Productos completo (`SPEC-016`, ver `src/docs/doc-api.md`): CRUD, tags estáticos (asignar/desasignar), ajuste manual de costo con historial de fluctuación de precios, y una máquina de estados restringida. Esta spec documenta la primera feature de catálogo del frontend, y con ella el contrato de un componente `DataTable` **genérico y reutilizable** (`components/DataTable`) que toda vista tabular futura del proyecto (almacenes, clientes, ventas, cotizaciones) debe consumir — no es exclusivo de Productos, aunque nace aquí porque es la primera feature que lo necesita (`react-data-table-component` ya está instalado).

El diseño se decidió de forma iterativa en conversación con el usuario, no sobre un wireframe interactivo previo (a diferencia de SPEC-008); los wireframes de §Wireframes son la síntesis de esa conversación, no un artefacto validado por separado. Decisiones clave capturadas como requisitos explícitos:

1. **Filtros híbridos**: buscador siempre visible + botón "Filtros" con popover para el resto de campos — se descartó tanto una barra de filtros completa (satura una tabla densa con 5 campos de filtro) como esconder también el buscador (es el filtro de mayor uso).
2. **Tres vistas, dos rutas**: Crear (`/productos/nuevo`, formulario en blanco sin tabs) es una ruta propia; Ver y Editar son la **misma** ruta (`/productos/:id`) y el mismo componente, alternando modo lectura/edición con el botón "Editar" — evita duplicar el layout de tabs entre una vista de solo-lectura y una de edición para los mismos datos.
3. **Redirección tras crear**: a la vista Ver (no Editar) — el formulario de creación captura toda la información básica (REQ-U19, completo desde v1.2.0), así que no hay nada pendiente inmediatamente después de guardar; aterrizar en modo lectura confirma visualmente "esto es lo que se creó" sin forzar al usuario a decidir si "ya terminó". _(v1.1.0 había reducido Crear a 3 campos y dejado esta razón como "a revalidar"; v1.2.0 revierte la reducción tras feedback de revisión visual — ver §Cambios — así que el razonamiento original vuelve a aplicar sin ajuste.)_
4. **Costo y precio va ligado al historial**: "Ajustar costo" (`PATCH /:id/costo`) no es un campo más del tab de edición general — es una acción de negocio propia que genera una entrada de historial, por eso vive en su propio tab junto con la gráfica/tabla que ese mismo ajuste alimenta.
5. **Gestión de tags con dos endpoints**: el backend expone `PUT /:id/tags` (reemplaza todos) y `DELETE /:id/tags/:tagId` (uno a uno) — el diseño aprovecha ambos desde un único `react-select` multi en vez de forzar un solo camino.
6. **`categoriaId`/`subcategoriaId` sin backend real todavía**: SPEC-016 los documenta explícitamente como "TODO — sin FK, sin módulo de Categorías". Se resuelve con un selector estático mock (`react-select`) hasta que exista el endpoint real (ver REQ-U20/REQ-O2).

## Wireframes

Referencia (ASCII, sin artefacto interactivo — ver nota en §Contexto):

```
Listado — /productos
┌────────────────────────────────────────────────────────────────────────┐
│ Productos                                          [+ Nuevo producto]  │
│ ┌───────────────────────────┐ ┌────────────┐                          │
│ │ Buscar...                 │ │ Filtros (2)│                          │
│ └───────────────────────────┘ └────────────┘                          │
├────────────────────────────────────────────────────────────────────────┤
│ Nombre                 Tipo      Estado    Precio    Costo prom. Tags ⋮│
│ ────────────────────────────────────────────────────────────────────  │
│ Camiseta M              FISICO   ● Activo  $190.00   $115.00    ●● ⋮  │
│  SKU-001                                                               │
│ Instalación a domicilio SERVICIO ● Activo  $350.00   —          —  ⋮  │
├────────────────────────────────────────────────────────────────────────┤
│                                                  ‹ 1 2 3 ›  20 / página │
└────────────────────────────────────────────────────────────────────────┘
  ↑ clic en fila (fuera de "⋮") navega a /productos/:id
  ↑ paginación siempre abajo-derecha del contenedor de la tabla

Ver/Editar — /productos/:id
┌────────────────────────────────────────────────────────────────────────┐
│ ‹ Volver   Camiseta M · SKU-001   [Estado: Activo ▾] [Editar] [Eliminar]│
├────────────────────────────────────────────────────────────────────────┤
│ [ Información general ] [ Costos y precio ] [ Tags ]                   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  (contenido del tab activo — lectura por defecto, formulario tras       │
│   "Editar"; cada tab guarda de forma independiente)                    │
│                                                                          │
└────────────────────────────────────────────────────────────────────────┘

Crear — /productos/nuevo (completo, revisado v1.2.0 — REQ-U19/U40/U41)
┌──────────────────────────────────────────────────────────────┐
│ IDENTIFICACIÓN ──────────────────────────────────────────────│
│ Nombre largo (2/3)              │ Nombre corto (1/3)          │
│                                  │  Sugerencia: "..." — usar   │
│ SKU                              │ Código de barras            │
├──────────────────────────────────────────────────────────────┤
│ CLASIFICACIÓN ───────────────────────────────────────────────│
│ Tipo          │ Categoría        │ Unidad de medida            │
│ [ ] Requiere báscula                                          │
├──────────────────────────────────────────────────────────────┤
│ COSTOS Y PRECIO ─────────────────────────────────────────────│
│ Costo estim.  │ Margen %         │ Precio venta                │
│                                  │  Sugerido: $200.00 — usar   │
│ Descuento %   │ Stock mínimo     │                             │
├──────────────────────────────────────────────────────────────┤
│ * Campos requeridos              [Cancelar] [Crear producto]  │
└──────────────────────────────────────────────────────────────┘
  ↑ card sobre bg-background (no bg-background-secondary, REQ-U44)
  ↑ nombre largo/corto en 2/3-1/3 en pantallas ≥640px, apilados debajo

Tab "Costos y precio" (detalle)
┌────────────────────────────────────────────────────────────────────────┐
│ Ajustar costo (superadmin/admin)                                       │
│  costoEstimado · costoPromedio · precioVenta · margenDeseado           │
│  [Guardar ajuste]                                                      │
│  (banner "Margen reducido: X% vs Y% deseado" si aplica)                │
├────────────────────────────────────────────────────────────────────────┤
│ Historial de precios (superadmin/admin/cajero) — LazyWidget            │
│  [gráfica: costoPromedio vs precioVenta en el tiempo]                  │
│  [tabla: fecha ▲/▼, costo ant/nuevo, precio ant/nuevo, margen, fuente] │
└────────────────────────────────────────────────────────────────────────┘
```

## Requisitos en formato EARS

### Ubiquitous (siempre aplica)

**`DataTable` genérico (`components/DataTable`)**

- **REQ-U1**: `DataTable` DEBE ser un componente genérico y tipado (`<T>`, nunca `any`), sin lógica de negocio ni imports de `services/` (CLAUDE.md §9) — recibe todo vía props (`columns`, `data`, `meta` de paginación, callbacks). Es el único componente de tabla que cualquier feature con listado tabular debe usar, no exclusivo de Productos.
- **REQ-U2**: `DataTable` DEBE construirse sobre `react-data-table-component`, con estilos propios vía la prop `customStyles` mapeados a los tokens de `brand.css`/`tailwind.config.ts` (fondo, texto, borde, hover, radios) — nunca los estilos default de la librería ni un valor hex hardcodeado.
- **REQ-U3**: `DataTable` DEBE delegar la paginación al servidor (`paginationServer`, `paginationTotalRows`, `onChangePage`, `onChangeRowsPerPage`) — los endpoints de listado ya devuelven `meta.page/limit/total`; nunca pagina en cliente sobre un array ya truncado por el backend.
- **REQ-U4**: El control de paginación DEBE quedar en la esquina inferior derecha del contenedor de la tabla (posición nativa del footer de `react-data-table-component`, sin reposicionar con CSS absoluto).
- **REQ-U5**: Cada feature consumidora DEBE declarar explícitamente el subconjunto de columnas a mostrar vía `columns` — `DataTable` nunca infiere ni muestra automáticamente todos los campos del objeto recibido.
- **REQ-U6**: `DataTable` DEBE aceptar una prop opcional `actions` (render por fila, ej. menú "⋮") — si no se provee, la tabla no reserva esa columna.
- **REQ-U7**: Cuando la feature provea `onRowClick`, `DataTable` DEBE aplicar `pointerOnHover`/`highlightOnHover` y usar `onRowClicked` de la librería para dispararlo; sin `onRowClick`, la fila no muestra ese affordance.
- **REQ-U8**: `DataTable` DEBE envolver la tabla en un contenedor `overflow-x-auto` (regla `Table Handling`, ui-ux-pro-max §5) para que un exceso de columnas nunca rompa el layout, incluso en la resolución mínima soportada del rango Web.

**Toolbar de filtros (mismo patrón genérico, reutilizable junto con `DataTable`)**

- **REQ-U9**: El área superior de cualquier vista con `DataTable` DEBE seguir el mismo patrón: buscador siempre visible a la izquierda, botón "Filtros" junto a él (abre popover con el resto de campos), y la acción primaria de la vista (ej. "Nuevo producto") a la derecha.
- **REQ-U10**: El botón "Filtros" DEBE mostrar un badge numérico con la cantidad de filtros activos (sin contar el buscador) cuando sea mayor a 0.
- **REQ-U11**: El popover de filtros DEBE comportarse como `role="dialog"`, atrapar el foco mientras esté abierto, cerrarse con `Escape` o clic fuera, y devolver el foco al botón "Filtros" al cerrarse (reglas `escape-routes`/`keyboard-nav`, ui-ux-pro-max).
- **REQ-U12**: El input de búsqueda DEBE aplicar debounce (300–500ms) antes de disparar la query — nunca una petición por cada tecla.

**Vista Listado (`/productos`, `ProductosListPage`)**

- **REQ-U13**: La ruta `/productos` DEBE renderizar `ProductosListPage`, que consume `GET /api/v1/productos` vía `useProductos()` (TanStack Query) con `q, estado, tipo, categoriaId, tag, requiereBascula, page, limit` reflejados en el estado de filtros de la vista.
- **REQ-U14**: Las columnas del listado DEBEN limitarse a: nombre corto — con un ícono SVG propio como prefijo indicando `tipo` (`FISICO`/`SERVICIO`; mismo trazo que `layouts/AppLayout/icons.tsx`: `viewBox 0 0 24 24`, `stroke 1.75`, extremos redondeados — no hay librería de íconos instalada, CLAUDE.md exige diseño 100% custom, ver esa nota en `icons.tsx`; el ícono lleva `aria-label`/tooltip descriptivo, nunca solo decorativo sin texto alternativo) y `sku` como texto secundario debajo —, estado (badge), precio de venta, costo promedio, tags (chips) y acciones (Eliminar) — nunca todos los campos de `ProductoResumenDTO`, y nunca una columna de texto separada para `tipo` (el ícono ya lo comunica junto al nombre, evita competir con el badge de Estado por atención).
- **REQ-U15**: Los valores monetarios de la tabla DEBEN formatearse en MXN con un helper centralizado (`lib/formatCurrency.ts`, nuevo) usando cifras tabulares (`tabular-nums`) para que no salten de ancho entre filas.
- **REQ-U16**: El badge de estado DEBE combinar color y texto (nunca solo color, regla `color-not-only`).
- **REQ-U17**: Cada chip de tag DEBE validar el contraste de su texto contra el color de fondo fijo del tag (`#RRGGBB` del seed, ver SPEC-016 §Seed de Tags) y elegir texto blanco o `--text-primary` según cuál cumpla AA (4.5:1) — nunca un color de texto fijo asumido para los 14 tags.
- **REQ-U18**: El clic en una fila (fuera de la columna de acciones) DEBE navegar a `/productos/:id`; la columna de acciones DEBE detener la propagación del clic para no disparar esa navegación.

**Vista Crear (`/productos/nuevo`, `ProductoCrearPage`)**

- **REQ-U19** _(revertido a completo en v1.2.0 — ver §Cambios; la reducción de v1.1.0 no gustó en revisión visual)_: La ruta `/productos/nuevo` DEBE renderizar el formulario **completo** (React Hook Form + Zod, `schemas/crearProducto.schema.ts` espejando `crearProductoSchema` del backend), organizado en tres secciones delimitadas por un encabezado uppercase + línea divisoria (REQ-U40): "Identificación" (nombre largo, nombre corto con sugerencia — REQ-U36 —, sku, código de barras), "Clasificación" (tipo, categoría, unidad de medida, báscula) y "Costos y precio" (costoEstimado, margenDeseadoPorcentaje, precioVenta con sugerencia — REQ-U38 —, descuentoPorcentaje, stockMinimo). Sin tabs — es un único formulario largo, no el flujo de Ver/Editar.
- **REQ-U20**: `categoriaId`/`subcategoriaId` (sección "Clasificación" de Crear, y tab "Información general" de Ver/Editar) DEBEN capturarse con un `react-select` (`components/Select`, REQ-U35) de opciones **estáticas mockeadas en el front** — no existe endpoint de Categorías todavía (SPEC-016 §TODOs Pendientes). Nunca un input de texto libre para un UUID.
- **REQ-U21**: `unidadMedida` (sección "Clasificación" de Crear, y tab "Información general" de Ver/Editar) DEBE poblarse desde una constante local `UNIDADES_MEDIDA` (espejo de `producto.constants.ts` del backend) — nunca hardcodeada inline en el componente.
- **REQ-U22**: Cuando `tipo = SERVICIO`, los campos exclusivos de FISICO (stockMinimo, unidadMedida, código de barras, requiere báscula) DEBEN **ocultarse** tanto en Crear como en el tab "Información general" de Ver/Editar (no solo deshabilitarse) — el backend los rechaza con 400 en creación (SPEC-016 REQ-X4/X11) y los ignora con advertencia en edición (REQ-E12); mismo criterio de ocultamiento en ambos casos, aunque el backend reaccione distinto.

**Vista Ver/Editar (`/productos/:id`, `ProductoDetallePage`)**

- **REQ-U23**: La ruta `/productos/:id` DEBE renderizar `ProductoDetallePage`, consumiendo `GET /api/v1/productos/:id` vía `useProducto(id)`. Es una única vista con dos modos — lectura (por defecto) y edición (tras clic en "Editar") — nunca dos rutas separadas.
- **REQ-U24**: El botón "Editar" DEBE ser visible únicamente cuando `data.role` (de `usePermisos()`) sea `superadmin` o `admin` — mismo criterio de roles de escritura que `producto.routes.ts` (`rolesEscritura`) en el backend.
- **REQ-U25**: En modo lectura, los campos DEBEN presentarse como texto plano, no como inputs deshabilitados (regla `read-only-distinction`).
- **REQ-U26**: El contenido DEBE organizarse en tabs: "Información general", "Costos y precio" (incluye ajuste de costo + historial + gráfica) y "Tags". El control de "Estado" vive en el header, fuera de los tabs.
- **REQ-U27**: Cada tab con campos editables DEBE guardar de forma independiente (su propia mutación/botón "Guardar") — nunca un único submit global que mezcle `PATCH /:id`, `PATCH /:id/costo` y `PUT /:id/tags` en una sola petición (son endpoints y efectos de negocio distintos, SPEC-016).
- **REQ-U28**: El tab "Costos y precio" DEBE mostrar, en este orden: formulario de ajuste (costoEstimado, costoPromedio, precioVenta, margenDeseadoPorcentaje — los 4 vía `MaskedInput`/`react-imask`, REQ-U37) con botón "Guardar ajuste" (`PATCH /:id/costo`), seguido de la gráfica y tabla de historial.
- **REQ-U29**: El tab "Tags" DEBE usar un único `react-select` multi (opciones = catálogo completo de 14 tags) que muestre los tags asignados como chips dentro del control.
- **REQ-U30**: La sección de historial dentro de "Costos y precio" DEBE cargarse vía `app/LazyWidget.tsx` (SPEC-006 REQ-U5) — es un widget pesado (Recharts) y visualmente aislado dentro de una ruta ya montada, el caso de uso explícito que esa spec documenta.
- **REQ-U31**: La gráfica de historial DEBE ser un `LineChart` de Recharts con dos series (`costoPromedio`, `precioVenta`) sobre el eje X `creadoEn`, diferenciadas por estilo de línea además de color (regla de accesibilidad para gráficas de tendencia, ui-ux-pro-max §chart).
- **REQ-U32**: La tabla de historial (alternativa accesible a la gráfica, regla `data-table`) DEBE mostrar por entrada: fecha con indicador ▲/▼ y color según si `precioVentaNuevo` subió o bajó respecto a `precioVentaAnterior`, costo anterior/nuevo, precio anterior/nuevo, margen anterior/nuevo y fuente (`AJUSTE_MANUAL`/`ORDEN_COMPRA`).
- **REQ-U33**: "Eliminar producto" DEBE estar disponible en la columna de acciones del listado y en el header de la vista Ver/Editar, visible solo para `superadmin`/`admin` (mismo criterio de REQ-U24), y siempre requerir el modal de confirmación de REQ-E12.
- **REQ-U34**: El header de la vista Ver/Editar DEBE mostrar, junto al nombre del producto, el mismo ícono de tipo usado en el listado (REQ-U14) seguido de la palabra completa ("Físico"/"Servicio") — nunca dentro del formulario del tab "Información general" como si fuera un campo editable: `tipo` es inmutable tras la creación (SPEC-016 §Clasificación), es un dato estructural que se muestra, no que se edita ahí.
- **REQ-U35** _(nuevo v1.1.0)_: Todo select del proyecto (no solo Productos) DEBE construirse sobre `react-select` vía el componente genérico `components/Select` (`unstyled` + `reactSelectClassNames`, mismo criterio que `CategoriaSelect`) — nunca un `<select>` nativo. `components/Select` es controlado (`value`/`onChange`), se conecta a React Hook Form vía `Controller`, nunca `register()` directo (react-select no expone un evento nativo compatible).
- **REQ-U36**: Mientras el campo "Nombre corto" esté vacío y "Nombre largo" tenga contenido, Crear DEBE mostrar una sugerencia derivada (`lib/suggestNombreCorto.ts`: recorte por palabra completa, máx. 60 caracteres) como acción clickeable bajo el input de "Nombre corto" — nunca autocompletar el campo sin que el usuario lo acepte explícitamente.
- **REQ-U37**: Todo campo numérico, monetario o porcentual del módulo (costoEstimado, costoPromedio, precioVenta, margenDeseadoPorcentaje, descuentoPorcentaje, stockMinimo) DEBE capturarse con `components/MaskedInput` (`react-imask`) — nunca `type="number"` (permite notación científica/`e`, spinners nativos inconsistentes) ni un `Input` de texto libre (permite letras). El valor que sale de `onChange`/`onAccept` es el string numérico limpio sin separador de miles (ej. `"1234.56"`), compatible directo con `decimalPositivoSchema`/el contrato Decimal-como-string del backend (SPEC-016 §DESIGN).
- **REQ-U38**: Tanto la sección "Costos y precio" de Crear como el tab "Costos y precio" de Ver/Editar DEBEN calcular `precioVentaSugerido` en el cliente (`lib/calcularPrecioVentaSugerido.ts`, réplica de la fórmula de Margen Comercial Real de SPEC-016 REQ-E9: `base / (1 - margen/100)`, `base = costoPromedio` si `> 0`, si no `costoEstimado`) mientras el usuario llena costoEstimado/costoPromedio/margenDeseadoPorcentaje, y mostrarlo como sugerencia clickeable junto al input de `precioVenta` — nunca sobrescribir `precioVenta` automáticamente (REQ-U7 de SPEC-016: el backend nunca calcula `precioVenta`, y por el mismo criterio el frontend tampoco lo hace sin consentimiento explícito del usuario). En Crear no existe `costoPromedio` todavía, así que la base siempre es `costoEstimado`.
- **REQ-U39**: Toda opción binaria (ej. `requiereBascula`) DEBE usar `components/Switch` (toggle accesible, `role="switch"`) — nunca un `<input type="checkbox">` nativo, que no sigue el lenguaje visual del design system.
- **REQ-U40** _(nuevo v1.2.0)_: Toda sección de un formulario largo (Crear, y cualquier futuro formulario multi-sección del proyecto) DEBE delimitarse con un encabezado propio: texto uppercase pequeño (`text-xs font-bold uppercase tracking-wide text-foreground-secondary`) seguido de una línea divisoria (`h-px flex-1 bg-border`) que ocupa el resto del ancho — regla `field-grouping` (ui-ux-pro-max), nunca solo un `<legend>` sin refuerzo visual (insuficiente para distinguirse de los labels de los campos, hallazgo de la revisión visual v1.1.0).
- **REQ-U41** _(nuevo v1.2.0)_: Los campos "Nombre largo" y "Nombre corto" DEBEN ir en una fila de 2 columnas con proporción 2/3 – 1/3 en pantallas `sm:` (640px) y superiores; por debajo de ese breakpoint se apilan en dos filas de una columna. El resto de los campos de un formulario largo DEBEN organizarse en grid de hasta 3 columnas (`sm:grid-cols-2 lg:grid-cols-3`) — nunca una columna única a ancho completo del contenedor cuando el campo es corto (sku, tipo, categoría, montos, etc.), que fue el problema reportado en la revisión visual v1.1.0.
- **REQ-U42** _(nuevo v1.2.0)_: Todo campo obligatorio DEBE marcarse con un asterisco rojo (`text-brand-coral-text`) inmediatamente después del label — soportado como prop `required` en `Input`, `Select` y `MaskedInput` (componentes genéricos, no una implementación ad-hoc por formulario). Todo formulario con al menos un campo requerido DEBE incluir, al pie, una nota "* Campos requeridos" separada por un borde superior — nunca dentro del grid de campos, para no interferir con su layout.
- **REQ-U43** _(nuevo v1.2.0)_: Todo botón del módulo de Productos DEBE usar `size="sm"` de `components/Button` — tamaño único estandarizado para toda la feature (antes mezclaba `sm` y el default `md` sin criterio, hallazgo de la revisión visual v1.1.0). Cuando un botón combine ícono + label, ambos DEBEN usarse juntos de forma consistente en todos los botones equivalentes del módulo (ej. "Nuevo producto"/"Crear producto" siempre con el mismo ícono "+").
- **REQ-U44** _(nuevo v1.2.0)_: Todo contenedor de tipo "card" (SPEC-008 REQ-U7) DEBE usar el token `bg-background` (`--bg-primary`), nunca `bg-background-secondary` — el fondo de página del shell autenticado ya es `--bg-secondary` (`layouts/AppLayout/Shell.tsx`), así que una card con ese mismo tono es indistinguible del fondo (hallazgo de la revisión visual v1.1.0: la card de Crear no se percibía como card). Las 3 vistas de Productos (listado, crear, detalle) DEBEN envolver su contenido principal en `rounded-lg border border-border bg-background p-4 shadow-sm` (o `p-6` para formularios).
- **REQ-U45** _(nuevo v1.2.0)_: Cuando el listado no tenga ningún producto registrado (REQ-X2), la toolbar DEBE ocultar el botón "Nuevo producto" — el CTA del estado vacío ("Crear producto") es el único punto de entrada en ese momento. Nunca mostrar dos botones con el mismo objetivo y distinta frase a la vez (hallazgo de la revisión visual v1.1.0).
- **REQ-U46** _(nuevo v1.3.0)_: La sección "Clasificación" DEBE incluir un selector "Subcategoría" junto a "Categoría": opcional, deshabilitado y sin opciones mientras no haya `categoriaId` elegido, y poblado únicamente con las categorías cuyo `parentId` (mock, `CATEGORIAS_MOCK`) sea igual al `categoriaId` seleccionado — nunca el catálogo completo de subcategorías de todas las categorías a la vez. Si el usuario cambia de categoría, `subcategoriaId` DEBE limpiarse automáticamente (una subcategoría de la categoría anterior ya no es válida). "Categoría" (a diferencia de "Subcategoría") es requerida en Crear — validado en `superRefine` de `crearProductoSchema`, no en el campo mismo (para no romper el tipo `string | undefined` que espera `<Select>` como prop controlada); el backend la mantiene opcional (SPEC-016), es una restricción de negocio del front, no del contrato de API.
- **REQ-U47** _(nuevo v1.3.0)_: Los botones equivalentes de creación ("Nuevo producto", "Crear producto" — listado y submit del formulario) DEBEN compartir el mismo ícono "+" (`features/productos/components/icons.tsx`, `PlusIcon`) junto al label. Los botones de acción secundaria/dismissive ("Cancelar", "Limpiar filtros", "Volver") NO llevan ícono — un ícono ahí no ayuda al reconocimiento (el texto ya es inequívoco) y le resta jerarquía visual a la acción primaria de la vista, que sí debe destacar. La consistencia exigida por REQ-U43 es "misma familia de acción → mismo tratamiento", no "todo botón lleva ícono".
- **REQ-U48** _(nuevo v1.3.0)_: El buscador de `DataTableToolbar` DEBE medir `h-9` (36px, mismo alto que `Button size="sm"`) y `w-56` — nunca `h-11`/`w-64`, que lo hacía ver desproporcionado frente a un botón `sm` contiguo (hallazgo de revisión visual v1.3.0). El botón "Filtros" (`FilterPopover`) y su panel DEBEN seguir el mismo criterio de tamaño/fondo que el resto del módulo (`size="sm"`, panel sobre `bg-background` — REQ-U44).

### State-driven (mientras X)

- **REQ-S1**: Mientras `useProductos()`/`useProducto()` estén en `isLoading`, `DataTable`/la vista de detalle DEBEN mostrar un skeleton (filas de `Skeleton` `block` por celda en la tabla; bloques por campo en el detalle) — nunca un spinner genérico (CLAUDE.md §8). El formulario de creación **nunca** muestra skeleton — no depende de datos remotos, se monta en blanco.
- **REQ-S2**: Mientras la sección de historial esté cargando su chunk (`LazyWidget`) o su query, DEBE mostrar su propio skeleton acotado a esa sección — nunca bloquear el resto de la vista Ver/Editar (SPEC-006 REQ-U5/X2).
- **REQ-S3**: Mientras el total de entradas de historial sea menor a 4, el tab DEBE mostrar solo la tabla (sin la gráfica) con una nota breve ("Aún no hay suficiente historial para graficar") — un line chart con <4 puntos es ruido visual sin valor (ui-ux-pro-max §chart, "Trend Over Time").
- **REQ-S4**: Mientras `estado = BORRADOR`, las transiciones disponibles en el control de Estado DEBEN limitarse a `ACTIVO`/`INACTIVO`; mientras `ACTIVO`, a `INACTIVO`/`DISCONTINUADO`; mientras `INACTIVO`, a `ACTIVO`/`DISCONTINUADO`; mientras `DISCONTINUADO`, únicamente a `INACTIVO` — misma matriz que `TRANSICIONES_ESTADO` (SPEC-016).
- **REQ-S5**: Mientras `tipo = SERVICIO` en la vista Ver/Editar, el tab "Información general" DEBE ocultar los campos exclusivos de FISICO — igual criterio que la creación (REQ-U22). `tipo` es inmutable tras la creación, así que esta condición nunca cambia dentro de la vida de un producto; no hay necesidad de mostrarlos deshabilitados con una nota (el backend solo genera `advertencias` si el front llegara a enviarlos, algo que este contrato evita por diseño).
- **REQ-S6**: Mientras el rol activo no esté en `[superadmin, admin]`, el formulario "Ajustar costo" DEBE ocultarse del tab "Costos y precio", dejando los valores en modo lectura.
- **REQ-S7**: Mientras el rol activo no esté en `[superadmin, admin, cajero]`, la sección de historial (gráfica + tabla) DEBE ocultarse del tab "Costos y precio" — coincide con `rolesHistorial` del backend; de otro modo `GET /:id/historial-precios` respondería 403 igualmente.

### Event-driven (cuando X)

- **REQ-E1**: Cuando el usuario escriba en el buscador, el sistema DEBE actualizar `q` tras el debounce (REQ-U12) y resetear `page` a 1.
- **REQ-E2**: Cuando el usuario abra el popover de filtros, sus cambios DEBEN quedar en un estado local (borrador) hasta que haga clic en "Aplicar" — evita un refetch por cada campo tocado mientras explora varios filtros a la vez. "Aplicar" resetea `page` a 1 y cierra el popover; "Limpiar" resetea todos los campos del popover sin cerrarlo.
- **REQ-E3**: Cuando el usuario haga clic en "Nuevo producto", el sistema DEBE navegar a `/productos/nuevo`.
- **REQ-E4**: Cuando `POST /api/v1/productos` responda 201, el sistema DEBE mostrar un toast de éxito con una acción secundaria "Ir al listado" y navegar automáticamente a `/productos/:id` (el `id` de la respuesta) en modo lectura.
- **REQ-E5**: Cuando el usuario haga clic en "Editar", el tab activo DEBE pasar a modo formulario (inputs habilitados) manteniendo el tab seleccionado — nunca resetear a "Información general".
- **REQ-E6**: Cuando `PATCH /:id/costo` responda con `alerta: { tipo: "MARGEN_REDUCIDO", ... }`, el sistema DEBE mostrar un banner inline dentro del tab (no un toast) con `margenReal`/`margenDeseado` — el ajuste ya se guardó, la alerta es informativa, no bloqueante (SPEC-016 REQ-E4).
- **REQ-E7**: Cuando el usuario seleccione un tag nuevo en el multi-select, el sistema DEBE llamar `PUT /:id/tags` con el array completo (tags actuales + el nuevo) — no existe endpoint de alta individual.
- **REQ-E8**: Cuando el usuario quite un tag (clic en la "x" del chip dentro del multi-select), el sistema DEBE llamar `DELETE /:id/tags/:tagId` para ese tag específico — nunca `PUT` con el array reducido.
- **REQ-E9**: Cuando el usuario cambie el estado a cualquier valor distinto de `DISCONTINUADO`, el cambio DEBE aplicarse de inmediato (`PATCH /:id/estado`) sin modal de confirmación.
- **REQ-E10**: Cuando el usuario intente cambiar el estado a `DISCONTINUADO`, el sistema DEBE mostrar un modal de confirmación antes de llamar `PATCH /:id/estado` (no puede revertirse directo a `ACTIVO`, mayor consecuencia de negocio que el resto de transiciones).
- **REQ-E11**: Cuando el usuario haga clic en "Eliminar producto" (listado o detalle), el sistema DEBE mostrar un modal de confirmación indicando explícitamente que la acción no puede deshacerse desde el sistema (no existe endpoint de restauración) antes de llamar `DELETE /:id`.
- **REQ-E12**: Cuando `DELETE /:id` se complete con éxito desde el listado, el sistema DEBE invalidar la query de listado y mostrar un toast de éxito, permaneciendo en `/productos`. Cuando se complete desde el detalle, DEBE navegar a `/productos`.
- **REQ-E13**: Cuando cualquier mutación de escritura (crear, actualizar, ajustar costo, cambiar estado, tags, eliminar) se complete con éxito, el sistema DEBE invalidar explícitamente `productosQueryKey` y, si aplica, `productoQueryKey(id)`/`historialPreciosQueryKey(id)` — CLAUDE.md §6, nunca depender solo de `staleTime`.
- **REQ-E14**: Cuando una mutación falle con un `ApiError` cuyo `details` sea un array de `ZodIssue` (`error.details`, ver `errorHandler.ts` del backend — poblado en errores 400 de validación, con o sin código de dominio), el sistema DEBE iterar cada issue y aplicar `setError(issue.path.join('.'), { message: issue.message })` en el formulario correspondiente — cubre el caso de múltiples campos inválidos a la vez, nunca solo un toast genérico cuando el campo es identificable.
- **REQ-E15**: Cuando una mutación falle con un `ApiError` **sin** `details` (errores de negocio 409 del service, ej. `ERR_PRODUCTO_SKU_DUPLICADO`/`ERR_PRODUCTO_CODIGO_BARRAS_DUPLICADO`), el sistema DEBE resolver el campo afectado con una tabla estática `code → campo` (`{ ERR_PRODUCTO_SKU_DUPLICADO: 'sku', ERR_PRODUCTO_CODIGO_BARRAS_DUPLICADO: 'codigoBarras' }`) y aplicar `setError` sobre ese campo con `error.message`.
- **REQ-E16**: Cuando una mutación falle con un `ApiError` cuyo `code` no tenga campo de formulario asociado en el contexto de su acción (ej. `ERR_PRODUCTO_ESTADO_TRANSICION_INVALIDA`, `ERR_TAG_NOT_FOUND`, `ERR_PRODUCTO_SKU_REQUERIDO`/`ERR_PRODUCTO_PRECIO_REQUERIDO` al cambiar estado), el sistema DEBE mostrar un toast (comportamiento por defecto del interceptor global de `apiClient.ts`) — no forzar un `setError` sin campo real al que anclarse.

### Optional (donde X)

- **REQ-O1**: Donde `incluirEliminados=true` esté en el filtro y el rol activo sea `superadmin`, el listado DEBE incluir productos eliminados marcados visualmente (badge "Eliminado", fila atenuada) — SPEC-016 REQ-O1.
- **REQ-O2**: Donde exista un módulo real de Categorías (spec futura de backend), el selector mock de `categoriaId`/`subcategoriaId` (REQ-U20) DEBE reemplazarse por un `react-select` con carga async contra el endpoint real, sin cambiar la forma del campo en el formulario (`categoriaId: string`) — el resto del contrato de esta spec no requiere cambios.

### Unwanted (si X entonces)

- **REQ-X1**: Si `GET /api/v1/productos` falla (red/servidor), la vista NO DEBE renderizar `DataTable` — DEBE mostrar un bloque de error con mensaje y acción "Reintentar" (`refetch`); es responsabilidad de la vista consumidora, no de `DataTable` en sí (CLAUDE.md §8).
- **REQ-X2**: Si el total de productos de la empresa es 0 sin ningún filtro aplicado, el sistema DEBE ocultar la tabla y mostrar un estado vacío dedicado ("Aún no has registrado productos" + botón "Crear producto") — nunca el mismo estado vacío que REQ-X3.
- **REQ-X3**: Si hay filtros o búsqueda activos y el resultado es 0, el sistema DEBE mostrar un estado vacío distinto ("No se encontraron productos con estos filtros" + botón "Limpiar filtros") — nunca reutilizar el CTA "Crear producto" de REQ-X2.
- **REQ-X4**: Si el usuario navega directo a `/productos/:id` con un `id` inexistente o de otra empresa (`ERR_PRODUCTO_NOT_FOUND`, 404), el sistema DEBE mostrar un estado de error dedicado ("Producto no encontrado") con acción "Volver al listado" — nunca un formulario vacío ni una excepción sin capturar.
- **REQ-X5**: Si un usuario sin rol `superadmin`/`admin` navega directo a `/productos/nuevo` por URL, `ProductoCrearPage` DEBE redirigir a `/productos` sin renderizar el formulario — el control de acceso no puede depender únicamente de ocultar el botón "Nuevo producto" (REQ-U24 aplicado también aquí).
- **REQ-X6**: Si el usuario cierra el modal de confirmación de estado (`DISCONTINUADO`) o de eliminar sin confirmar, el sistema NO DEBE ejecutar la mutación correspondiente ni alterar el estado visual del control.
- **REQ-X7**: Si `margenDeseadoPorcentaje` es `>= 100`, o `descuentoPorcentaje` está fuera de `[0,100]`, en cualquier formulario (crear, ajustar costo), el sistema DEBE bloquear el submit localmente con Zod, mismo mensaje que el backend (SPEC-016 REQ-X9/X12) — nunca depender solo del roundtrip al servidor para este caso.
- **REQ-X8**: Si el usuario intenta seleccionar un 11º tag en el multi-select, el sistema DEBE impedirlo (deshabilitar las opciones restantes) y mostrar "Máximo 10 tags por producto" — límite `tagIds.max(10)` del backend.

## Criterios de aceptación

Cada REQ de arriba DEBE tener al menos un test que:

1. Lo referencia por ID exacto en un comentario: `// spec:SPEC-009:REQ-<X>`
2. Falla si el requisito no se cumple
3. Se ejecuta en `npm test` sin configuración adicional

## Tests trazados

Pendiente — spec en estado `draft`, sin implementación ni tests todavía (`_POLICY.md`: solo specs `active` bloquean CI por falta de trazabilidad).

## Auditoría

> Ref: **api-pos SPEC-008** (`auditoria.spec.md`)

Sin eventos de auditoría propios del frontend. Los seis eventos del módulo ya se registran en el backend vía `registrarAuditoria` (`producto.routes.ts`, SPEC-016 §Auditoría) al completarse cada mutación — el frontend no ejecuta lógica adicional, solo dispara las peticiones correctas:

| Constante | Cuándo se registra (backend) |
| --- | --- |
| `PRODUCTO_CREATED` | Al completar `POST /api/v1/productos` (REQ-E4) |
| `PRODUCTO_UPDATED` | Al completar `PATCH /api/v1/productos/:id` (tab Información general) |
| `PRODUCTO_ESTADO_CHANGED` | Al completar `PATCH /api/v1/productos/:id/estado` (REQ-E9/E10) |
| `PRODUCTO_COSTO_AJUSTADO` | Al completar `PATCH /api/v1/productos/:id/costo` (REQ-E6) |
| `PRODUCTO_DELETED` | Al completar `DELETE /api/v1/productos/:id` (REQ-E11/E12) |
| `PRODUCTO_TAGS_UPDATED` | Al completar `PUT /:id/tags` o `DELETE /:id/tags/:tagId` (REQ-E7/E8) |

## Dependencias

- **Depende de**: SPEC-001 (Design System) — `Skeleton`, `Button`, `Input`, tokens de `brand.css`/`tailwind.config.ts`.
- **Depende de**: SPEC-006 (Code Splitting) — las tres rutas nuevas (`/productos`, `/productos/nuevo`, `/productos/:id`) nacen con `React.lazy()` por archivo propio (REQ-U1/U4 de esa spec); la sección de historial usa `app/LazyWidget.tsx` (REQ-U5, caso de uso explícito: "una gráfica de Recharts... visualmente aislada").
- **Depende de**: SPEC-007 (Permisos) — `RequirePermission modulo="modulo.productos"` gatea la ruta completa; `data.role` de `usePermisos()` gatea las acciones de escritura dentro de la vista (REQ-U24/S6/S7/X5), replicando `rolesEscritura`/`rolesHistorial` del backend.
- **Depende de**: SPEC-008 (AppLayout) — la vista vive dentro del shell (sidebar/topbar/scroll único), cards redondeadas del área de contenido.
- **Depende de**: `api-pos` SPEC-016 (Módulo de Productos) — contrato completo de endpoints, DTOs y reglas de validación que esta spec consume; cualquier cambio de esa spec (ya en v1.3.1) debe revisarse contra esta.
- **Bloquea**: ninguna feature todavía, pero establece el patrón `DataTable` genérico + toolbar de filtros que **toda** futura vista tabular (almacenes, clientes, ventas, cotizaciones) debe reutilizar — requisito explícito del usuario, no solo de Productos.
- **Riesgo documentado**: `categoriaId`/`subcategoriaId` dependen de un selector mock (REQ-U20) hasta que exista el módulo real de Categorías en `api-pos` (sin fecha). No bloqueante para esta spec — REQ-O2 define la migración cuando el endpoint real exista.

## Cambios

- v1.3.0 (2026-08-04): (1) **REQ-U46** (nuevo) — selector "Subcategoría" (opcional) junto a "Categoría" (ahora requerida en Crear); `CATEGORIAS_MOCK` pasa de lista plana a jerarquía padre/hijo (`parentId`) con helpers `CATEGORIAS_PADRE_MOCK`/`getSubcategoriasDe`; `subcategoriaId` se limpia si cambia la categoría. (2) **REQ-U47** (nuevo) — se agrega el ícono "+" faltante al botón submit "Crear producto" del formulario (ya lo tenían los del listado); se documenta explícitamente por qué "Cancelar" y equivalentes NO llevan ícono (acción secundaria, el texto ya es inequívoco, un ícono ahí compite con la jerarquía visual de la acción primaria). (3) **REQ-U48** (nuevo) — se corrige el tamaño del buscador (`h-11 w-64` → `h-9 w-56`) y del botón "Filtros" (sin `size="sm"` → con `size="sm"`), que se veían desproporcionados junto a los demás controles ya reducidos; de paso, el panel del popover pasa de `bg-background-secondary` a `bg-background` (mismo criterio de REQ-U44).
- v1.2.0 (2026-08-04): Revertida la reducción de v1.1.0 tras revisión visual del formulario ya construido: Crear vuelve a capturar **todos** los campos (REQ-U19), pero corrigiendo la causa real del formulario "pesado" — no el número de campos, sino la falta de estructura visual y el ancho descontrolado de los inputs. Cambios: (1) **REQ-U40** (nuevo) — secciones con encabezado uppercase + línea divisoria, no solo `<legend>`. (2) **REQ-U41** (nuevo) — nombre largo/corto en fila 2/3–1/3 responsive; el resto de los campos en grid de hasta 3 columnas, nunca ancho completo para campos cortos. (3) **REQ-U42** (nuevo) — asterisco rojo en campos requeridos vía prop `required` en `Input`/`Select`/`MaskedInput`, más nota "* Campos requeridos" al pie sin interferir con el grid. (4) **REQ-U43** (nuevo) — `size="sm"` estandarizado en todos los botones del módulo (antes mezclaba `sm`/`md` sin criterio). (5) **REQ-U44** (nuevo) — se corrige un bug real: las cards usaban `bg-background-secondary`, el mismo tono que el fondo de página del shell (`Shell.tsx`), por eso no se percibían como cards; ahora usan `bg-background`. (6) **REQ-U45** (nuevo) — se corrige el botón duplicado del listado vacío ("Nuevo producto" en la toolbar + "Crear producto" en el estado vacío, mismo objetivo): la toolbar lo oculta cuando no hay productos registrados. La razón de REQ-E4 (redirigir a Ver tras crear) vuelve a aplicar sin ajuste, ver §Contexto punto 3.
- v1.1.0 (2026-08-04): Revisión tras feedback de implementación visual (formulario de Crear ya construido y revisado): (1) **REQ-U19 reescrito** — Crear pasa de un formulario completo (identificación + clasificación + costos) a uno mínimo (nombre largo, nombre corto, tipo); el resto se mueve a los tabs de Ver/Editar, que ya existían. Motivo: el formulario completo resultaba abrumador (muchos inputs con jerarquía visual débil) — se prefirió reducir el formulario estructuralmente en vez de esconder los mismos campos con acordeones. (2) **REQ-U35** (nuevo): `react-select` obligatorio en todo select del proyecto, no solo Productos — se corrige el uso de `<select>` nativo detectado en la implementación inicial. (3) **REQ-U36** (nuevo): sugerencia de "nombre corto" derivada de "nombre largo". (4) **REQ-U37** (nuevo): `MaskedInput`/`react-imask` obligatorio en campos numéricos/monetarios/porcentuales — se corrige que la implementación inicial permitía letras en esos campos. (5) **REQ-U38** (nuevo): `precioVentaSugerido` calculado en vivo en el cliente durante el ajuste de costo — se identifica como el "campo que debía calcularse automáticamente" señalado en la revisión. (6) **REQ-U39** (nuevo): `Switch` obligatorio para opciones binarias — se corrige el checkbox nativo detectado en la implementación inicial. Nota abierta sin resolver: la razón original de REQ-E4 (redirigir a Ver tras crear) asumía un formulario completo; con Crear mínimo, Ver ya no muestra "todo lo que se acaba de llenar" — se mantiene el destino por ahora (ver §Contexto punto 3) pero queda señalado como decisión a revalidar.
- v1.0.0 (2026-08-04): Versión inicial (`draft`). Documenta el componente `DataTable` genérico (`react-data-table-component` + toolbar de filtros con popover), el listado de Productos con paginación server-side, la vista de creación (formulario único) y la vista Ver/Editar (misma ruta, tabs: Información general, Costos y precio con ajuste + historial + gráfica Recharts, Tags), gestión de tags vía los dos endpoints existentes, control de Estado con confirmación condicional, eliminación con confirmación, y la estrategia de mapeo de errores de backend a campos de formulario (`error.details` con `ZodIssue[]` vs. tabla estática de códigos de negocio sin `details`).
