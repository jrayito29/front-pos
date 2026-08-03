# SPEC-006: Code Splitting por Ruta (Lazy Loading)

## Metadata

- **ID**: SPEC-006
- **Dominio**: arquitectura _(valor nuevo — ver nota en §Contexto)_
- **Versión**: 1.2.0
- **Estado**: active
- **Owner**: `Equipo Frontend POS-MX`
- **Creada**: 2026-07-29
- **Última revisión**: 2026-07-29

## Contexto

`app/router.tsx` importa hoy `AuthLayout`, `CompletarPerfilWizard`, `LoginForm` y `RegistroForm` de forma **estática** desde el barrel `features/auth/index.ts`. No existe code splitting en el proyecto: `vite.config.ts` no define `manualChunks` ni ninguna configuración de split, y todo el árbol de imports síncronos de `router.tsx` termina en un único chunk inicial. Efecto concreto: un usuario que solo visita `/login` descarga también el wizard completo de `/completar-perfil` (`StepDatosPersonales`, `StepDomicilio`, `StepEmpresa`, `WizardStepTransition`, `StepIndicator`) — una vista a la que, en el flujo normal (`perfilCompleto: true`), nunca llega.

Esta spec define el contrato de carga perezosa a nivel de ruta que debe aplicarse retroactivamente a las rutas ya existentes y, de aquí en adelante, a toda feature nueva que se agregue a `router.tsx` (ventas, inventario, productos, almacenes, clientes — hoy `RouteStub`). Es infraestructura de carga en el cliente, sin componente visual propio ni lógica de negocio — no encaja en ninguno de los dominios de negocio del template (`fiscal|auth|pos|inventario|...`), de la misma forma que `api-pos` ya tiene precedente de specs de infraestructura pura fuera de esos dominios (`cache.spec.md`). Se introduce `arquitectura` como valor de `Dominio` para este tipo de spec transversal; el campo ya se usa de forma no estrictamente enumerada en el propio backend (`auth-permisos.spec.md` declara `Dominio: auth / admin`, un valor compuesto).

## Requisitos en formato EARS

### Ubiquitous (siempre aplica)

- **REQ-U1**: Toda ruta declarada en `app/router.tsx` que renderice un componente de feature (no un `RouteStub`) DEBE cargarlo vía `React.lazy()` con `import()` dinámico — sin excepción, incluyendo las rutas ya existentes (`LoginForm`, `RegistroForm`, `CompletarPerfilWizard`, `AuthLayout`). _(nota de implementación)_ Cada `import()` DEBE apuntar al archivo propio del componente (ej. `features/auth/components/LoginForm`), nunca al barrel `features/auth`: si los 4 `lazy()` importaran el barrel, Vite/Rollup los colapsaría en un solo chunk async (mismo specifier = mismo límite de chunk, porque el barrel importa los 4 de forma estática), anulando el propósito de este REQ. Es una excepción deliberada y documentada a "una feature solo se consume vía `index.ts`" (CLAUDE.md §3) — `app/router.tsx` es la raíz de composición de la app, no una feature consumiendo a otra; el barrel sigue existiendo y exportando normal para cualquier otro consumidor (REQ-U3).
- **REQ-U2**: El sistema DEBE envolver el árbol de `<Routes>` en `<Suspense>` con un `fallback` que sea un skeleton acorde al contexto de la ruta (nunca un spinner genérico), cumpliendo CLAUDE.md §8.
- **REQ-U3**: El barrel `index.ts` de cada feature DEBE seguir exportando sus componentes de forma normal (no lazy). La responsabilidad de aplicar `React.lazy()` vive exclusivamente en el punto de consumo (`router.tsx`), nunca dentro de la feature — así la feature permanece autocontenida y sus tests de componente pueden importar directo, sin depender de `Suspense`.
- **REQ-U4**: El split a nivel de ruta DEBE aplicarse a **feature completa** (una ruta = un chunk), no a subcomponentes individuales dentro de un mismo flujo secuencial. Ejemplo explícito: los 3 pasos del wizard de completar perfil (`StepDatosPersonales`, `StepDomicilio`, `StepEmpresa`) NO se dividen entre sí — viajan juntos en el chunk de `CompletarPerfilWizard`, porque se consumen en secuencia inmediata dentro de la misma sesión de navegación, y fragmentarlos añade requests adicionales sin ahorro real. Esto no excluye el split de **widgets independientes** dentro de una ruta ya montada (ver REQ-U5) — son casos distintos: un flujo secuencial vs. un componente visualmente aislado que puede fallar sin afectar al resto de la vista.
- **REQ-U5** _(adenda v1.1.0, implementación revisada v1.2.0)_: Un componente pesado y visualmente aislado dentro de una ruta ya montada (ej. una gráfica de Recharts en un dashboard de reportes, un widget que agrega datos de forma independiente al resto de la vista) PUEDE cargarse con su propio `import()` dinámico anidado, distinto del chunk de la ruta, vía el helper `app/LazyWidget.tsx`. DEBE tener su propio estado de carga/error acotado a ese componente (ver REQ-X2) — nunca reutilizar el fallback/`ErrorBoundary` de nivel de ruta (REQ-U2/X1) para este caso, porque eso escalaría una falla local a toda la pantalla. _(nota de implementación)_ `LazyWidget` NO usa `React.lazy()`/`use()`/`Suspense` real pese a que la redacción original de esta spec los mencionaba como mecanismo: `React.lazy()` no puede crearse dentro del cuerpo de render (bloqueado por la regla `react-hooks/static-components` del proyecto, orientada al React Compiler) y recrearlo en cada reintento es la única forma de invalidar una promesa ya rechazada; la alternativa con `use()` (crear la promesa fuera del render) entra en un loop de reintentos internos de React frente a una promesa rechazada dentro de un `Suspense`, reproducido de forma aislada en tests (timeout indefinido). `LazyWidget` dispara el mismo `import()` dinámico (mismo beneficio de code splitting) con un patrón manual de estado (`useState`/`useEffect`), determinista y sin este riesgo.

### State-driven (mientras X)

- **REQ-S1**: Mientras el chunk de una ruta esté descargándose (primera navegación a esa ruta en la sesión del navegador), el sistema DEBE mostrar el `fallback` de `Suspense` (REQ-U2) en vez de una pantalla en blanco o contenido parcialmente montado.

### Event-driven (cuando X)

- **REQ-E1**: Cuando el usuario navegue a una ruta cuyo chunk ya fue descargado en la sesión de navegación actual, el sistema NO DEBE volver a mostrar el `fallback` de `Suspense` — comportamiento nativo de `React.lazy` (la promesa del import se cachea), que este REQ fija como criterio de aceptación explícito a testear, no como supuesto implícito.

### Unwanted (si X entonces)

- **REQ-X1**: Si la descarga del chunk de una **ruta** (REQ-U1) falla (conexión inestable, o un deploy nuevo invalida el hash del chunk que el navegador tenía cacheado — error típico `Failed to fetch dynamically imported module`), el sistema DEBE capturar el error con un `ErrorBoundary` dedicado a nivel de `router.tsx` (no dejar la pantalla en blanco ni una excepción sin capturar) y ofrecer una acción "Recargar" que fuerza un full page reload — único caso legítimo de recarga completa en toda la SPA, necesario para obtener el manifiesto de chunks actualizado. Este REQ aplica exclusivamente a fallas de navegación (el chunk de la ruta destino, que aún no ha renderizado nada): en ese momento no existe "resto de la vista" que preservar, por lo que el fallback de pantalla completa no oculta contenido funcional. **No aplica** a fallas de un widget lazy dentro de una ruta ya montada (ver REQ-X2).
- **REQ-X2** _(adenda v1.1.0)_: Si la descarga del `import()` de un widget lazy anidado (REQ-U5) falla, el sistema NO DEBE propagar el error al `ErrorBoundary` de ruta (REQ-X1) ni forzar un full page reload. DEBE mostrar, acotado a ese componente, un estado de error (ej. "No se pudo cargar este gráfico") con una acción "Reintentar" que solo dispara un `import()` nuevo de ese widget, y dejar el resto de la vista (navegación, otros widgets, filtros) completamente funcional.

## Criterios de aceptación

Cada REQ de arriba DEBE tener al menos un test que:

1. Lo referencia por ID exacto en un comentario: `// spec:SPEC-006:REQ-<X>`
2. Falla si el requisito no se cumple
3. Se ejecuta en `npm test` sin configuración adicional

## Tests trazados

Suite: Vitest + Testing Library (`npm test` → `vitest run`). 58/58 tests pasan (5 nuevos de esta spec); `eslint .` limpio. Evidencia adicional de build real (`npx vite build`, fuera de la suite automatizada — ver Cambios v1.2.0 para el detalle del chunk manifest, que es la única forma de verificar REQ-U1/U4 según §Criterios de aceptación):

| REQ | Archivo |
| --- | --- |
| U1  | `src/app/router.test.tsx` (wiring end-to-end) + build real (`vite build`, ver §Cambios) |
| U2  | `src/app/router.test.tsx` (regresión: rutas resuelven correctamente vía Suspense) |
| U3  | Por construcción: `features/auth/index.ts` no se modificó; tests de componentes existentes (`LoginForm`, `CompletarPerfilWizard`, etc.) siguen importando directo, sin pasar por `router.tsx` |
| U4  | Build real (separación de chunks, ver Cambios v1.2.0) |
| U5  | `src/app/LazyWidget.test.tsx` |
| S1  | `src/app/LazyWidget.test.tsx` (fallback mientras carga) |
| E1  | `src/app/router.test.tsx` |
| X1  | `src/app/RouteErrorBoundary.test.tsx` |
| X2  | `src/app/LazyWidget.test.tsx` |

## Auditoría

> Ref: **api-pos SPEC-008** (`auditoria.spec.md`)

Sin eventos de auditoría directos — es una optimización de carga de bundle en el cliente, no afecta datos de negocio ni invoca endpoints nuevos. No hay constante en `AUDIT_ACTIONS` aplicable, ni se requiere agregar una.

## Dependencias

- **Depende de**: SPEC-001 (Design System) — se agregó `Skeleton` a SPEC-001 antes de codificarlo (regla obligatoria de esa spec), usado como `fallback` de ruta (REQ-U2) y de widget (REQ-U5).
- **Depende de**: SPEC-002 (Login), SPEC-003 (Pre-registro), SPEC-004 (Completar Perfil) — dueñas del comportamiento funcional de los componentes que esta spec convierte a carga perezosa; esta spec no altera ese comportamiento, solo su forma de carga.
- **Bloquea**: toda feature nueva agregada a `app/router.tsx` de aquí en adelante (ventas, inventario, productos, almacenes, clientes) — deben nacer con este contrato aplicado desde el primer commit, no como deuda técnica a resolver después. Los widgets pesados de reportes (Recharts) DEBEN usar `app/LazyWidget.tsx` (REQ-U5) en vez de un patrón ad-hoc propio.
- **Hallazgo no relacionado, reportado aparte**: al verificar el chunk splitting con `npm run build` (`tsc -b && vite build`) se encontró que `tsc -b` falla hoy con errores de tipos preexistentes en `features/auth/components/CompletarPerfilWizard.tsx` (mismatch de genéricos de React Hook Form), **sin relación con esta spec** — no se tocó ese archivo. El chequeo `tsc --noEmit` desde la raíz no lo detecta porque `tsconfig.json` raíz declara `"files": []` y delega todo a `references` (solo `tsc -b` los resuelve). La verificación de esta spec se hizo con `vite build` directo (que no type-checka, solo transpila/empaqueta) para no bloquear en un bug ajeno. Se reporta como hallazgo separado, no se corrige aquí.

## Cambios

- v1.2.0 (2026-07-29): Implementación completa, pasa a `active`. Archivos nuevos: `app/RouteErrorBoundary.tsx` (REQ-X1, class component + "Recargar"), `app/RouteLoadingSkeleton.tsx` (REQ-U2/S1), `app/LazyWidget.tsx` (REQ-U5/X2, ver nota de implementación revisada en REQ-U5 — sin `Suspense`/`use()` real). `app/router.tsx` reescrito: los 4 componentes de auth pasan a `React.lazy()` importando su archivo propio (no el barrel, ver nota en REQ-U1), `<Routes>` envuelto en `<Suspense>`+`RouteErrorBoundary`. Se extendió `SPEC-001` con la entrada de `Skeleton` antes de codificarlo. Tests: `RouteErrorBoundary.test.tsx`, `LazyWidget.test.tsx`, `router.test.tsx` (nuevos). Verificado con `npx vite build`: `LoginForm`/`RegistroForm`/`AuthLayout`/`CompletarPerfilWizard` quedan en chunks separados (3.19 kB / 5.45 kB / 1.99 kB / 7.33 kB respectivamente) — visitar `/login` ya no descarga el chunk del wizard, que es el problema original documentado en §Contexto. Se encontró (y reportó aparte, ver §Dependencias) un bug preexistente de `tsc -b` en `CompletarPerfilWizard.tsx` no relacionado con esta spec.
- v1.1.0 (2026-07-29): Adenda de revisión previa a aprobación. Se agrega REQ-U5 (split anidado de widgets independientes dentro de una ruta ya montada, ej. gráficas de reportes) y REQ-X2 (aislamiento local del widget, sin escalar a full page reload). Se aclara el alcance de REQ-U4 (no excluye el split de widgets, solo el de subcomponentes de un mismo flujo secuencial) y REQ-X1 (aplica solo a fallas de chunk de ruta durante navegación, nunca a widgets dentro de una ruta ya montada). Motivo: REQ-X1 original no distinguía entre "falla antes de que la ruta renderice algo" (pantalla completa aceptable) y "falla de un componente aislado con el resto de la vista funcional" (requiere aislamiento).
- v1.0.0 (2026-07-29): Versión inicial (`draft`). Documenta el estado actual sin code splitting y el contrato a aplicar retroactivamente a las rutas de auth y prospectivamente a toda ruta futura.
