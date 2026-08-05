# Petición 005: Lectura post-commit ejecutada dentro de la propia transacción en `producto.service.ts` — `ERR_PRODUCTO_NOT_FOUND` al crear productos

## Metadata

- **Fecha**: 2026-08-04
- **Solicitante**: Equipo Frontend POS-MX
- **Origen**: alpha-pos — reproducido en pruebas reales sobre SPEC-009 (módulo Productos, recién implementado). `POST /api/v1/productos` responde `404 ERR_PRODUCTO_NOT_FOUND` en el 100% de los intentos de creación; la operación se revierte por completo (rollback), el producto **no** queda guardado.
- **Estado**: Pendiente
- **Prioridad**: Alta — bloquea por completo el flujo de alta de productos. No es un caso borde: ocurre siempre, con cualquier payload válido.

## Problema

`crearProductoService` (`api-pos/src/services/producto.service.ts`, líneas 342-387) abre una transacción con `prisma.$transaction(async (tx) => { ... })` en la línea 350. Dentro de ese callback:

1. Crea el producto vía `tx.producto.create(...)` (líneas 353-374) — usa el cliente transaccional `tx`, correcto.
2. Asigna tags y registra auditoría, también vía `tx` (líneas 376-383) — correcto.
3. En la línea 385, como valor de retorno del callback, llama a `return obtenerProductoService(productoId, empresaId);` — **todavía dentro de la transacción abierta**.

El problema es que `obtenerProductoService` (líneas ~254-265) no recibe ni usa `tx`: lee con el cliente **global** `prisma` (`prisma.producto.findFirst({ where: { id, empresaId, deletedAt: null }, ... })`, línea 258). Bajo el nivel de aislamiento por defecto de MySQL (REPEATABLE READ), una conexión distinta a la de la transacción abierta no puede ver filas insertadas y aún no confirmadas por esa transacción. El `SELECT` no encuentra el producto recién creado, `obtenerProductoService` lanza `AppError(PRODUCTO_ERRORS.NOT_FOUND, ...)` (líneas 263-265), esa excepción escapa del callback de `$transaction`, Prisma hace **rollback completo** de la transacción (incluyendo el `INSERT` ya ejecutado), y el error que llega al cliente es `404 ERR_PRODUCTO_NOT_FOUND` — un código que semánticamente no corresponde a una creación fallida.

### El mismo patrón se repite en otros 5 call sites

Confirmado leyendo el archivo completo — todos llaman `obtenerProductoService(id, empresaId)` como última línea dentro de su propio `prisma.$transaction`, usando el cliente global no transaccional:

| Función | Línea de apertura de `$transaction` | Línea de la llamada a `obtenerProductoService` | Efecto observable |
|---|---|---|---|
| `crearProductoService` | 350 | 385 | **Falla dura** — `404 NOT_FOUND`, rollback completo, producto nunca se guarda. |
| `actualizarProductoService` | 449 | 481 | Lectura silenciosa de datos desactualizados (ver nota abajo) en vez de error, porque el registro ya existía antes de la transacción. |
| `cambiarEstadoProductoService` | 518 | 526 | Igual — devuelve el estado anterior al cliente aunque el cambio sí se persistió. |
| `ajustarCostoService` | 557 | 589 | Igual — devuelve costo/precio anteriores al cliente aunque el ajuste sí se persistió. |
| `asignarTagsService` | 644 | 656 | Igual — devuelve el set de tags anterior al cliente aunque la asignación sí se persistió. |
| `desasignarTagService` | 675 | 683 | Igual — mismo caso que `asignarTagsService`. |

En los 5 casos de `UPDATE` no hay 404 porque el `findFirst` sin filtro de fecha de creación reciente sí encuentra la fila (ya existía antes de abrir la transacción) — pero la lectura ocurre **antes del commit**, por lo que devuelve el snapshot previo a los cambios de esa misma transacción bajo REPEATABLE READ. El síntoma ahí es más sutil (el frontend recibe y muestra datos obsoletos justo después de guardar exitosamente), pero es el mismo bug de fondo. En `crearProductoService` es el único caso donde el bug se manifiesta como una falla dura, porque la fila no existe en absoluto fuera de la transacción hasta el commit.

### Precedente ya documentado

`SPEC-020` (`categorias-productos.spec.md`, changelog v1.0.1, hallazgo `MENOR-03`) ya había identificado este mismo patrón de "lectura post-commit fuera del `tx`" en el módulo de Categorías y lo dejó documentado como una decisión aceptada (comentario `DESIGN`), tratándolo como un patrón sistémico de bajo riesgo. El caso de `crearProductoService` muestra que, al menos en creación, el riesgo no es bajo: es una falla funcional total y reproducible al 100%, no un caso borde de concurrencia.

## Petición concreta

Que se corrija `producto.service.ts` para que la lectura final ocurra usando el cliente transaccional `tx`, no el cliente global `prisma`, en los 6 call sites listados arriba. Dos formas posibles (a criterio de backend, cualquiera resuelve el problema):

1. Que `obtenerProductoService` acepte un cliente Prisma opcional como parámetro (`prisma.producto.findFirst` vs `tx.producto.findFirst`), con `prisma` global como valor por defecto, y que cada uno de los 6 call sites le pase `tx` explícitamente.
2. Que la lectura final se haga con `tx.producto.findFirst(...)` directamente dentro del callback, en vez de reutilizar `obtenerProductoService`.

En particular, pedimos que la corrección para `crearProductoService` (línea 385) se priorice sobre las otras 5, dado que es la única que produce una falla dura y bloquea por completo la creación de productos.

## Por qué no se puede resolver desde el frontend

Es un problema de alcance de transacción (`tx` vs cliente global `prisma`) enteramente dentro de la capa de servicio del backend — el frontend no tiene visibilidad ni control sobre qué cliente Prisma usa cada lectura interna. No es un error transitorio de red o de contención: es determinístico, ocurre siempre bajo REPEATABLE READ, y ningún reintento desde el cliente lo evita.

## Impacto si no se resuelve

- El módulo de Productos (SPEC-009, ya implementado y verificado en frontend) queda completamente bloqueado en su flujo de creación — no se puede dar de alta ningún producto nuevo.
- Los 5 endpoints de actualización afectados (`PATCH /:id`, cambio de estado, ajuste de costo, asignar/desasignar tags) devuelven al cliente una versión desactualizada del producto justo después de una operación exitosa. Esto puede leerse como "no se guardó" cuando en realidad sí se persistió, generando reportes de bugs fantasma y una UI que muestra datos incorrectos hasta el siguiente refetch.

## Referencias

- `api-pos/src/services/producto.service.ts` — líneas 342-387 (`crearProductoService`), 254-265 (`obtenerProductoService`), 449-481 (`actualizarProductoService`), 518-526 (`cambiarEstadoProductoService`), 557-589 (`ajustarCostoService`), 644-656 (`asignarTagsService`), 675-683 (`desasignarTagService`).
- `api-pos/src/docs/specs/categorias-productos.spec.md` — SPEC-020, changelog v1.0.1, hallazgo `MENOR-03` (mismo patrón, documentado previamente para Categorías con severidad baja).
- `alpha-pos/src/docs/specs/SPEC-009-productos.md` — spec del módulo Productos en frontend, bloqueado por este bug en su flujo de creación (REQ-U1).

## Respuesta de backend

_Pendiente._
