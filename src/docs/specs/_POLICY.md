# Política de Specs — POS-MX

## Qué es una spec

Una spec es un **contrato de comportamiento ejecutable**. Define qué DEBE hacer el sistema
en términos verificables. No es documentación narrativa — es la fuente de verdad para tests.

## Formato obligatorio: EARS

Toda spec activa usa el formato **EARS** (Easy Approach to Requirements Syntax):

| Tipo             | Sintaxis                                               | Cuándo usar                                |
| ---------------- | ------------------------------------------------------ | ------------------------------------------ |
| **Ubiquitous**   | El sistema DEBE ...                                    | Comportamiento invariante (siempre aplica) |
| **State-driven** | Mientas<estado\>, el sistema DEBE ...                  | Depende de un estado activo                |
| **Event-driven** | Cuando\<evento\>, el sistema DEBE ...                  | Respuesta a un evento específico           |
| **Optional**     | Cuando\<condición\>, el sistema DEBE ...               | Feature flags, config condicional          |
| **Unwanted**     | Si<condición indeseada\>, entonces el sistema DEBE ... | Manejo de errores y edge cases             |

## Regla dorada

**Toda spec activa requiere ≥1 test que la referencia por ID.**

Formato del comentario en el test:

```javascript
// spec:SPEC-001:REQ-E1
```

Si una spec no tiene test trazado, `spec-validator.sh` bloquea CI.

## Nomenclatura

- Archivo: `<dominio>-<caso>.spec.md` (ej: `fiscal-timbrado.spec.md`)
- ID interno: `SPEC-<NNN>` (ej: `SPEC-001`)
- Requisitos: `REQ-<tipo><número>` donde tipo = U|S|E|O|X (ej: `REQ-E1`, `REQ-X2`)

## Estados

| Estado       | Significado                         |
| ------------ | ----------------------------------- |
| `draft`      | En redacción, no validada por CI    |
| `active`     | Vigente, CI valida trazabilidad     |
| `deprecated` | Retirada, mover a`specs/_archived/` |

## Cómo retirar una spec

1. Cambiar estado a `deprecated`
2. Mover a `specs/_archived/<razón>/`
3. Documentar en el README de la carpeta de archivo: fecha, razón, restaurable (sí/no)

## Validación

- **Local**: `bash scripts/spec-lint.sh` (formato EARS)
- **Local**: `bash scripts/spec-validator.sh` (trazabilidad spec↔test)
- **CI**: Stage `spec-validation` bloquea merge si falla

## Auditoría (obligatorio en toda spec)

Toda spec activa DEBE incluir una sección `## Auditoría` antes de `## Dependencias`.

Esa sección debe:

1. Referenciar **SPEC-008** explícitamente.
2. Listar en una tabla las constantes `AUDIT_ACTIONS` que el módulo introduce o usa, con su descripción.
3. Si el módulo no produce eventos de auditoría directos (ej. infraestructura pura), declararlo con justificación: `Sin eventos de auditoría directos — [razón]`.

Formato mínimo:

```markdown
## Auditoría

> Ref: **SPEC-008**

| Acción | Constante            | Cuándo se registra                          |
| ------ | -------------------- | ------------------------------------------- |
| Login  | `AUTH_LOGIN_ATTEMPT` | En cada intento de login, exitoso o fallido |
```

**Regla de implementación:** antes de codificar un endpoint nuevo, verificar si su operación está en `AUDIT_ACTIONS`. Si no está, agregar la constante al catálogo de SPEC-008 primero.

---

## Scope

Esta política aplica a `src/docs/specs/*.spec.md`.
Archivos con prefijo `_` (como este) son metadata, no specs.
