# Petición 006: Orden jerárquico (padre → hijos) en `GET /api/v1/categorias`

## Metadata

- **Fecha**: 2026-08-05
- **Solicitante**: Equipo Frontend POS-MX
- **Origen**: `alpha-pos` — módulo de gestión de Categorías (SPEC-020), recién implementado en frontend, reportado durante pruebas manuales del listado
- **Estado**: Pendiente
- **Prioridad**: Media — no bloquea el uso del módulo (todo el CRUD funciona), pero degrada la legibilidad del listado en cualquier tenant con jerarquías reales (raíz + subcategorías)

## Problema

`GET /api/v1/categorias` devuelve la lista paginada sin ningún orden jerárquico garantizado — el orden observado hoy es alfabético plano sobre `nombre`, sin agrupar por `padreId`. Esto hace que una subcategoría pueda aparecer antes, o muy lejos, de su propia categoría padre en el listado.

**Ejemplo reproducido**: con las categorías "Ropa Dama" (raíz), "Pantalones" (raíz) y "Blusas" (subcategoría de "Ropa Dama"), el orden alfabético actual entrega:

```
Blusas       (subcategoría de "Ropa Dama")
Pantalones   (raíz, sin relación con Blusas)
Ropa Dama    (raíz — el padre real de Blusas)
```

"Blusas" aparece primero, dos posiciones antes que su propia categoría padre — no hay ninguna pista visual de esa relación al ojear la tabla.

### Por qué esto le pega directo al frontend

`CategoriasListPage` (`alpha-pos`) es una tabla **plana y paginada server-side** (`DataTable` genérico, sin soporte de filas anidadas/árbol), consistente con la forma de la respuesta de la API. Sin un orden jerárquico desde el servidor, el frontend no tiene forma confiable de reconstruir el árbol: la paginación (`page`/`limit`) puede repartir un padre y sus hijos en páginas distintas del resultado, así que cualquier reordenamiento intentado del lado del cliente solo podría aplicarse "por página" (mejor esfuerzo, ver sección siguiente), nunca garantizado.

## Petición concreta

Que `GET /api/v1/categorias` devuelva las categorías agrupadas jerárquicamente: cada categoría raíz seguida inmediatamente por sus subcategorías directas, en vez del orden alfabético plano actual. Es decir, un "flatten" del árbol a 2 niveles (único nivel de profundidad soportado por SPEC-020) — algo equivalente a:

```sql
ORDER BY COALESCE(padreId, id), (padreId IS NOT NULL), nombre
```

de forma que el resultado quede: raíz A, hijas de A (alfabético), raíz B, hijas de B (alfabético), etc.

Con el ejemplo de arriba, el orden esperado sería:

```
Pantalones   (raíz, sin hijas)
Ropa Dama    (raíz)
Blusas       (subcategoría de "Ropa Dama" — justo después de su padre)
```

**Preferencia**: que sea el comportamiento *por defecto* del endpoint, sin agregar un parámetro nuevo — hoy SPEC-020 no documenta ningún `ORDER BY` como parte del contrato (§Parámetros de Búsqueda — `GET /api/v1/categorias`), así que no debería romper a ningún consumidor existente.

**Alternativa aceptable** si cambiar el default no es viable por algún motivo de backend: un parámetro opcional, ej. `orden=jerarquico`, que active este comportamiento sin tocar el default actual.

## Por qué no se puede resolver desde el frontend

La paginación es server-side (`page`/`limit` sobre el conjunto ya filtrado). Un padre y sus hijos pueden terminar en páginas distintas del resultado paginado — ningún reordenamiento del lado del cliente puede garantizar el agrupamiento jerárquico de forma consistente entre páginas. Solo el servidor, que ve el conjunto completo antes de aplicar `LIMIT`/`OFFSET`, puede aplicar este orden de forma confiable.

## Impacto si no se resuelve

El listado de Categorías sigue siendo funcionalmente correcto (todo el CRUD — crear, editar, cambiar estado, eliminar, filtrar — funciona sin depender de este orden). El único impacto es de legibilidad: la relación padre-hijo no es evidente al ojear la tabla, especialmente en tenants con varias categorías raíz y subcategorías. Frontend queda sin poder mostrar una jerarquía confiable en el listado hasta que esto se resuelva (o se acuerde una mitigación adicional, ej. columna "Categoría padre" resuelta por nombre, en una iteración futura).

## Referencias

- `api-pos/src/docs/specs/categorias-productos.spec.md` — SPEC-020, endpoint `GET /api/v1/categorias`, §Parámetros de Búsqueda y §Estructura de Respuestas (sin `ORDER BY` documentado como parte del contrato)
- `api-pos/src/services/categorias.service.ts` — función de listado del módulo de Categorías
- `alpha-pos/src/features/categorias/pages/CategoriasListPage.tsx` — tabla plana consumidora de `GET /api/v1/categorias`
- `alpha-pos/src/features/categorias/components/categoriasTableColumns.tsx` — columnas actuales del listado (sin resolución de categoría padre)

## Respuesta de backend

_Pendiente._
