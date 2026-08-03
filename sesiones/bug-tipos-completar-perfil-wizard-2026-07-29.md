# Informe de Bug: `tsc -b` falla en `CompletarPerfilWizard.tsx` — 2026-07-29

## Metadata

| Campo             | Valor                                                                 |
| -------------------- | ---------------------------------------------------------------------- |
| **Fecha detección**  | 2026-07-29                                                              |
| **Detectado durante** | Verificación de build real (`npm run build`) para SPEC-006 (code splitting) |
| **Severidad**        | Alta — bloquea `npm run build` por completo                            |
| **Relación con SPEC-006** | Ninguna — hallazgo colateral, no introducido por esa spec              |
| **Archivo afectado**  | `src/features/auth/components/CompletarPerfilWizard.tsx`               |
| **Estado**            | Reportado, no corregido (fuera de alcance de la sesión en que se detectó) |

## Cómo se detectó

`npm run build` ejecuta `tsc -b && vite build`. Al correrlo para confirmar el chunk splitting de SPEC-006, `tsc -b` falló con 4 errores de tipos en `CompletarPerfilWizard.tsx` (líneas 30, 62, 88, 89, 90). No se había detectado antes porque:

- `npx tsc --noEmit` desde la raíz del repo no revisa nada real: `tsconfig.json` raíz declara `"files": []` y delega todo a `references` (`tsconfig.app.json`/`tsconfig.node.json`), que solo `tsc -b` resuelve.
- `npm run lint` (ESLint + `typescript-eslint`) no hace la misma inferencia cruzada de genéricos que el compilador en modo build.
- `npm test` (Vitest) transpila con esbuild vía Vite — no type-checka.

Es decir: **ninguno de los tres comandos que normalmente se corren en desarrollo detecta este bug.** Solo `npm run build` (o `npx tsc -p tsconfig.app.json --noEmit`) lo revela.

## Mensaje de error (resumen)

```
src/features/auth/components/CompletarPerfilWizard.tsx(30,5): error TS2322:
  Type 'Resolver<{ ...; telefono?: string | undefined; ... }>' is not assignable to
  type 'Resolver<{ ...; telefono: string | undefined; ... }>'.
    Property 'telefono' is optional in type A but required in type B.

src/features/auth/components/CompletarPerfilWizard.tsx(62,44): error TS2345:
  Argument of type 'TFieldValues' is not assignable to parameter of type '{ ...; telefono: string | undefined; ... }'.

src/features/auth/components/CompletarPerfilWizard.tsx(88,53) / (89,47) / (90,53): error TS2322:
  Type 'UseFormReturn<{ ...; telefono: string | undefined; ... }, any, TFieldValues>' is not
  assignable to type 'UseFormReturn<{ ...; telefono?: string | undefined; ... }>'.
```

## Causa raíz

El campo `telefono` en `src/features/auth/schemas/completarPerfil.schema.ts` combina `.optional()` con `.transform()`:

```ts
telefono: z
  .string()
  .optional()
  .transform((value) => value?.replace(PHONE_SEPARATORS_REGEX, ''))
  .refine((value) => !value || PHONE_DIGITS_REGEX.test(value), 'El teléfono debe tener 10 dígitos'),
```

Zod distingue entre el **tipo de entrada** (`z.input<Schema>`, lo que el usuario escribe) y el **tipo de salida** (`z.output<Schema>`/`z.infer<Schema>`, lo que resulta después de `.transform()`). Con `.optional().transform(fn)`, el resultado del pipeline es una propiedad **requerida** de tipo `string | undefined` (`telefono: string | undefined`) en el output — no una propiedad **opcional** (`telefono?: string`), aunque a simple vista parezcan equivalentes. Es una distinción real de TypeScript: una propiedad opcional puede omitirse del objeto; una propiedad requerida de tipo `T | undefined` debe estar presente, aunque su valor sea `undefined`.

`CompletarPerfilFormValues` se define como `z.infer<typeof completarPerfilSchema>` (el tipo de **salida**) y se usa para **dos propósitos que deberían ser distintos**:

1. `useForm<CompletarPerfilFormValues>()` en `CompletarPerfilWizard.tsx:29` — debería tipar el formulario con el tipo de **entrada** (lo que RHF maneja mientras el usuario escribe, antes de transformar).
2. El tipo compartido `methods: UseFormReturn<CompletarPerfilFormValues>` que reciben `StepDatosPersonales`, `StepDomicilio` y `StepEmpresa` como prop.

`zodResolver(completarPerfilSchema)` infiere internamente un `Resolver` basado en cómo Zod ve el schema completo (con `telefono` como propiedad requerida `string | undefined`, por el `.transform()`), lo cual no coincide con el tipo declarado explícitamente en `useForm<CompletarPerfilFormValues>` (donde TypeScript, al calcular `z.infer` sobre el objeto completo, en algunos casos sí preserva `telefono` como opcional según cómo se combinen los modificadores) — de ahí el mismatch reportado por el compilador.

## Por qué no se corrigió en esta sesión

No se tocó porque:

- No es responsabilidad de SPEC-006 (code splitting) ni de SPEC-005 (sesión tenant), las specs trabajadas en esta sesión — ninguna de las dos toca formularios ni schemas de Zod.
- Corregirlo requiere decidir una estrategia de tipado (ver recomendación abajo) que toca `completarPerfil.schema.ts`, `CompletarPerfilWizard.tsx` y los 3 `Step*.tsx` — su propio dominio (SPEC-004), con tests propios que no se querían tocar sin la aprobación explícita del owner de esa spec.

## Recomendación de fix (no implementada)

Separar el tipo de **entrada** del tipo de **salida** del schema, usando los dos genéricos que Zod expone para esto:

- `CompletarPerfilFormInput = z.input<typeof completarPerfilSchema>` — usar este para `useForm<...>()` y para el tipo `methods` que reciben los `Step*.tsx` (es el shape que RHF maneja mientras el usuario captura datos, antes de transformar).
- `CompletarPerfilFormValues = z.infer<typeof completarPerfilSchema>` (el actual, tipo de **salida**) — reservarlo únicamente para lo que llega al callback de `handleSubmit()` en `handleSiguiente()` (`CompletarPerfilWizard.tsx:62`, lo que efectivamente se envía a `mutate()`).

React Hook Form v7.43+ soporta esto de forma nativa con un tercer genérico: `useForm<TFieldValues, TContext, TTransformedValues>()`, donde `TTransformedValues` es el tipo de salida post-`zodResolver`. Aplicarlo evitaría además tener que exportar/mantener dos tipos por separado.

## Impacto si no se corrige

- `npm run build` sigue roto — bloquea cualquier deploy real o pipeline de CI que dependa de ese script.
- No afecta al comportamiento en runtime hoy (`vite build` sin `tsc -b` sí genera un bundle funcional, y `npm test`/`npm run dev` no se ven afectados) — es un problema de integridad de tipos y de la cadena de build formal, no un bug funcional reproducible en la UI.

## Referencias

- `src/features/auth/components/CompletarPerfilWizard.tsx` (líneas 27-33, 52-66)
- `src/features/auth/schemas/completarPerfil.schema.ts` (líneas 15-42)
- `src/features/auth/components/StepDatosPersonales.tsx`, `StepDomicilio.tsx`, `StepEmpresa.tsx` (consumidores de `methods: UseFormReturn<CompletarPerfilFormValues>`)
- SPEC-004 (`src/docs/specs/SPEC-004-auth-completar-perfil.md`) REQ-U8 — dueña del schema y su excepción documentada de endurecimiento de `telefono`/`codigoPostal`
