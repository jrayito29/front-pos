# Estructura del Proyecto — Guía para el Equipo de Front

> Documento de referencia para que el desarrollo del front (Web/Flutter) no tenga que intuir
> contratos, errores o tipos de datos. Cada carpeta listada abajo indica **qué** contiene,
> **para qué le sirve al front** y **cómo se nombran los archivos**, para que la búsqueda sea directa. La consulta de esta información debe hacerce a /Users/usuario/Desktop/api-pos/src

## Índice rápido — "¿Qué necesito y dónde lo busco?"

| Necesito saber...                                                    | Voy a...                                                               |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Qué reglas de validación tiene un campo (min, max, regex, requerido) | `src/validators/`                                                      |
| Qué forma (shape) tiene la respuesta de un endpoint                  | `src/interfaces/`                                                      |
| Qué valores exactos puede tener un enum/estado/rol/código de error   | `src/constants/`                                                       |
| Qué endpoints existen, parámetros, respuestas y errores documentados | Swagger vivo (`http://localhost:3000/api-docs/`) + `src/docs/swagger/` |
| Por qué existe una regla de negocio (contexto, casos borde)          | `src/docs/specs/`                                                      |
| Detalle narrativo de un módulo específico                            | `src/docs/details/`                                                    |
| Estructura de una tabla de base de datos                             | `src/docs/database/`                                                   |

---

## Árbol jerárquico completo

```
/
├── prisma/                     [INTERNO] — no consumir directo desde front
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/             una carpeta por migración (timestamp_nombre)
├── src/
│   ├── config/                 [INTERNO] — env, logger, swagger, prisma client
│   ├── constants/              [FRONT] — enums, roles, estados, códigos de error
│   ├── controllers/            [INTERNO] — no aplica al front
│   ├── docs/                   [FRONT] — documentación de contrato y negocio
│   │   ├── database/           esquema de tablas en SQL comentado
│   │   ├── details/            notas narrativas por módulo
│   │   ├── specs/              contratos de comportamiento (EARS) por módulo
│   │   │   └── _archived/      specs retiradas, no vigentes
│   │   └── swagger/            schemas OpenAPI reutilizables por módulo
│   ├── interfaces/              [FRONT] — tipos TS de entrada/salida por módulo
│   ├── middlewares/             [INTERNO] — auth, roles, validación, errores
│   ├── routes/v1/                [INTERNO] — definición de endpoints por módulo
│   ├── services/                 [INTERNO] — lógica de negocio y transacciones
│   ├── utils/                    [INTERNO] — helpers (fechas, tokens, ids, email)
│   └── validators/               [FRONT] — esquemas Zod de validación de entrada
├── tests/                       [INTERNO] — un subdirectorio por módulo
├── sesiones/                    [INTERNO] — bitácora de implementación
├── audit/                       [INTERNO] — auditorías técnicas de cada spec
├── scripts/                     [INTERNO] — spec-lint.sh, spec-validator.sh
└── logs/                        [INTERNO] — logs de Winston (no versionado)
```

**Regla general:** todo lo marcado `[INTERNO]` es implementación de la API y no debería ser necesario
consultarlo desde front. Si el front necesita mirar ahí para entender un contrato, es señal de que
falta documentar algo en `constants/`, `interfaces/`, `validators/` o `docs/swagger/` — repórtalo.

---

## Detalle por carpeta relevante para Front

### `src/constants/`

Contiene los valores exactos (strings/enums) que la API usa como roles, estados, tipos y catálogos
de error. Es la fuente de verdad — **nunca hardcodear estos valores en el front**, importarlos o
copiarlos literal desde aquí.

- **Nomenclatura de archivo:** `<recurso>.constants.ts` (ej. `producto.constants.ts`, `auth.constants.ts`).
- **Barrel file:** `index.ts` re-exporta las constantes de uso transversal (`ROLES`, `ORDER_TYPES`,
  `ORDER_STATUS`, `MOVEMENT_TYPES`) — punto de entrada recomendado para lo genérico.
- **Excepción de nombre a conocer:** el dominio de almacenes (`ALMACEN_ERRORS`, `TIPO_ALMACEN`) vive
  dentro de `sucursales.constants.ts`, no en un archivo `almacenes.constants.ts` propio.
- Archivos actuales: `audit`, `auth`, `consecutivo`, `departamentos`, `empleados`, `http`,
  `ordenCompra`, `permisos`, `planes`, `producto`, `proveedores`, `sucursalActiva`, `sucursales`,
  `usuarios`.

### `src/interfaces/`

Tipos de TypeScript que describen exactamente qué recibe y qué devuelve cada recurso (DTOs de
entrada/salida). Úsalos como referencia de tipado 1:1 para los modelos del front.

- **Nomenclatura de archivo:** `<recurso>.interfaces.ts`.
- **Excepción de nombre a conocer:** al igual que en `constants/`, los tipos de almacenes están
  dentro de `sucursales.interfaces.ts`.
- Archivos actuales: `audit`, `auth`, `consecutivo`, `departamentos`, `empleados`, `ordenCompra`,
  `permisos`, `planes`, `producto`, `proveedores`, `sucursalActiva`, `sucursales`, `usuarios`.

### `src/validators/`

Esquemas **Zod** que validan cada input de la API. Si el front usa React Hook Form + Zod, estos son
los esquemas a reutilizar (vía `zodResolver`) para que la validación de formulario sea idéntica
byte-a-byte a la de la API — no una reinterpretación de las mismas reglas.

- **Nomenclatura de archivo:** `<recurso>.validator.ts` (singular, no `validators.ts`).
- Archivos actuales: `almacenes`, `audit`, `auth`, `departamentos`, `empleados`, `ordenCompra`,
  `permisos`, `planes`, `producto`, `proveedores`, `puestos`, `sucursalActiva`, `sucursales`,
  `usuarios`.
- **Nota:** aquí `almacenes.validator.ts` sí existe como archivo propio (a diferencia de
  `constants/` e `interfaces/`, donde comparte archivo con `sucursales`).

### `src/docs/swagger/`

Schemas de OpenAPI reutilizables (`components.schemas`) que se referencian desde los bloques
`@swagger` de los controllers. Es la base de la documentación que ve el front en `/api-docs`.

- **Nomenclatura de archivo:** `<recurso>.schemas.ts`.

### `src/docs/specs/`

Contratos de comportamiento en formato EARS (`_POLICY.md` define el estándar). Cada uno explica el
**por qué** de una regla de negocio, no solo el shape de datos — útil cuando el front necesita
entender un flujo (ej. cuándo una orden de compra cambia de estado, qué reglas de visibilidad
aplican por rol).

- **Nomenclatura de archivo:** `<dominio>-<caso>.spec.md` (ej. `ordenes-compra.spec.md`,
  `sucursal-activa-usuario.spec.md`).
- `_TEMPLATE.spec.md` y `_POLICY.md` son metadata, no specs (prefijo `_`).
- `_archived/` contiene specs retiradas — no vigentes, ignorar salvo investigación histórica.

### `src/docs/details/` y `src/docs/database/`

- `details/`: notas narrativas puntuales sobre un módulo (ej. `almacenes-details.md`,
  `auditoria-transacciones.md`). Nomenclatura: `<tema>-<detalle>.md`.
- `database/`: definición de tablas en SQL comentado, una por entidad (ej. `users.sql`,
  `suscripciones.sql`). Útil para entender relaciones sin acceso directo a la base de datos.

---

## Convención de nomenclatura — resumen

| Capa             | Patrón de archivo          | Ejemplo                   |
| ---------------- | -------------------------- | ------------------------- |
| Constantes       | `<recurso>.constants.ts`   | `producto.constants.ts`   |
| Interfaces/DTOs  | `<recurso>.interfaces.ts`  | `empleados.interfaces.ts` |
| Validadores Zod  | `<recurso>.validator.ts`   | `auth.validator.ts`       |
| Schemas Swagger  | `<recurso>.schemas.ts`     | `planes.schemas.ts`       |
| Specs de negocio | `<dominio>-<caso>.spec.md` | `ordenes-compra.spec.md`  |

**Sobre el nombre del `<recurso>`:** la mayoría usa una sola palabra en minúsculas y plural
(`usuarios`, `sucursales`, `proveedores`). Los recursos compuestos usan `camelCase`
(`ordenCompra`, `sucursalActiva`) en vez de kebab-case o guion bajo — mantén ese mismo criterio si
generas nombres de tipos/hooks equivalentes en el front (ej. `useOrdenCompra`, no `useOrden-compra`).

---

## Notas para mantenimiento de este documento

Este archivo debe actualizarse cuando:

- Se agregue un nuevo módulo/recurso (nuevo `<recurso>.*` en cualquiera de las 3 carpetas `[FRONT]`).
- Se detecte una excepción de nomenclatura nueva (como el caso `almacenes` ↔ `sucursales`).
- Cambie la política de specs (`_POLICY.md`).
