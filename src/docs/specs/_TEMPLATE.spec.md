# SPEC-`<ID>`: <Título corto>

## Metadata

- **ID**: SPEC-<NÚMERO>
- **Dominio**: <fiscal|auth|pos|inventario|clientes|ventas|config|admin>
- **Versión**: 1.0.0
- **Estado**: draft | active | deprecated
- **Owner**: `<nombre>`
- **Creada**: YYYY-MM-DD
- **Última revisión**: YYYY-MM-DD

## Contexto

[2-3 párrafos: qué problema resuelve, quién lo necesita, por qué ahora]

## Requisitos en formato EARS

### Ubiquitous (siempre aplica)

- **REQ-U1**: El sistema DEBE `<comportamiento invariante>`

### State-driven (mientras X)

- **REQ-S1**: Mientras `<estado>`, el sistema DEBE `<comportamiento>`

### Event-driven (cuando X)

- **REQ-E1**: Cuando `<evento>`, el sistema DEBE `<respuesta>`

### Optional (donde X)

- **REQ-O1**: Donde <feature flag / condición>, el sistema DEBE `<comportamiento>`

### Unwanted (si X entonces)

- **REQ-X1**: If <condición indeseada>, entonces el sistema DEBE `<manejo de error>`

## Criterios de aceptación

Cada REQ de arriba DEBE tener al menos un test que:

1. Lo referencia por ID exacto en un comentario: `// spec:SPEC-<ID>:REQ-<X>`
2. Falla si el requisito no se cumple
3. Se ejecuta en `npm test` sin configuración adicional

## Tests trazados

<!-- Lista aquí los archivos de test que validan esta spec -->

- `src/<archivo>.test.js` — valida REQ-U1, REQ-E1
- `src/<archivo>.test.js` — valida REQ-X1

## Dependencias

- **Depende de**: [otras specs si aplica]
- **Bloquea**: [specs que la necesitan]

## Cambios

- v1.0.0 (YYYY-MM-DD): Versión inicial
